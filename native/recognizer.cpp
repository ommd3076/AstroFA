#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <string>
#include <vector>
#ifdef COSTELLAR_OFFLINE_BENCH
#include <cerrno>
#include <cstdlib>
#include <locale>
#include <sstream>
#endif
#include "catalog.generated.hpp"
#include "recognizer_score_rules.hpp"

static constexpr const char* kNoMatchJson = "{\"status\":\"NO_MATCH\",\"candidates\":[],\"bestMatch\":null}\n";
#ifdef COSTELLAR_OFFLINE_BENCH
static constexpr size_t kMaxRequestBytes = 32768;   // 32 KiB
static constexpr size_t kMaxOutputBytes = 1048576;  // 1 MiB
static constexpr int kMaxJsonDepth = 32;
#endif

static double norm(const std::vector<Point>& pts) {
  double mx=0, my=0;
  for (auto p:pts) { mx+=p.x; my+=p.y; }
  mx/=pts.size(); my/=pts.size();
  double e=0; for(auto p:pts) e+=(p.x-mx)*(p.x-mx)+(p.y-my)*(p.y-my);
  return std::sqrt(e/pts.size());
}

struct Score { const Pattern* p; double residual, angle, scale; };
static bool fit(const std::vector<Point>& a, const std::vector<Point>& b, Score& out) {
  if(a.size()!=b.size() || a.size()<3) return false;
  double ax=0,ay=0,bx=0,by=0;
  for(size_t i=0;i<a.size();++i){ax+=a[i].x;ay+=a[i].y;bx+=b[i].x;by+=b[i].y;}
  ax/=a.size();ay/=a.size();bx/=b.size();by/=b.size();
  double ea=0,eb=0,dot=0,cross=0;
  for(size_t i=0;i<a.size();++i){double x=a[i].x-ax,y=a[i].y-ay,u=b[i].x-bx,v=b[i].y-by; ea+=x*x+y*y;eb+=u*u+v*v;dot+=x*u+y*v;cross+=x*v-y*u;}
  if(ea<1e-12 || eb<1e-12) return false;
  // Proper (orientation-preserving) 2D Procrustes fit. A reflection is never considered.
  double theta=std::atan2(cross,dot), c=std::cos(theta),s=std::sin(theta);
  double scale=std::hypot(dot,cross)/ea, err=0;
  for(size_t i=0;i<a.size();++i){double x=a[i].x-ax,y=a[i].y-ay,u=b[i].x-bx,v=b[i].y-by;double dx=scale*(c*x-s*y)-u,dy=scale*(s*x+c*y)-v;err+=dx*dx+dy*dy;}
  const double shapeResidual=std::sqrt(err/eb);
  // Local signed turns and normalized segment lengths make the score sensitive to
  // reordered vertices and local deformations, even when their global fit is close.
  double pathA=0,pathB=0;
  std::vector<double> edgeA(a.size()-1),edgeB(b.size()-1),turnA,turnB;
  for(size_t i=0;i+1<a.size();++i){edgeA[i]=std::hypot(a[i+1].x-a[i].x,a[i+1].y-a[i].y);edgeB[i]=std::hypot(b[i+1].x-b[i].x,b[i+1].y-b[i].y);if(edgeA[i]<1e-9||edgeB[i]<1e-9)return false;pathA+=edgeA[i];pathB+=edgeB[i];}
  for(size_t i=0;i+2<a.size();++i){
    double ax=a[i+1].x-a[i].x, ay=a[i+1].y-a[i].y, bx=a[i+2].x-a[i+1].x, by=a[i+2].y-a[i+1].y;
    double cx=b[i+1].x-b[i].x, cy=b[i+1].y-b[i].y, dx=b[i+2].x-b[i+1].x, dy=b[i+2].y-b[i+1].y;
    turnA.push_back(std::atan2(ax*by-ay*bx,ax*bx+ay*by));
    turnB.push_back(std::atan2(cx*dy-cy*dx,cx*dx+cy*dy));
  }
  double segmentErr=0,turnErr=0;
  for(size_t i=0;i<edgeA.size();++i){double d=edgeA[i]/pathA-edgeB[i]/pathB;segmentErr+=d*d;}
  for(size_t i=0;i<turnA.size();++i){double d=std::remainder(turnA[i]-turnB[i],2.0*3.14159265358979323846)/3.14159265358979323846;turnErr+=d*d;}
  const double segmentResidual=std::sqrt(segmentErr/edgeA.size());
  const double turnResidual=std::sqrt(turnErr/turnA.size());
  out.residual=std::sqrt(0.80*shapeResidual*shapeResidual+0.10*segmentResidual*segmentResidual+0.10*turnResidual*turnResidual);
  out.angle=theta*180.0/3.14159265358979323846; out.scale=scale; return true;
}

static bool compute_matches(const std::vector<Point>& input, std::vector<Score>& result) {
  result.clear();
  if (input.size() < 3 || input.size() > 128) return false;
  for (const auto& p : input) {
    if (!std::isfinite(p.x) || !std::isfinite(p.y) || std::abs(p.x) > 1e6 || std::abs(p.y) > 1e6) {
      return false;
    }
  }
  if (norm(input) < 1e-8) return false;

  std::vector<Score> scores;
  for (const auto& p : kPatterns) {
    if (p.points.size() != input.size()) continue;
    Score s{&p, 0, 0, 0};
    if (fit(input, p.points, s) && costellar_score_rules::is_residual_accepted(s.residual)) {
      scores.push_back(s);
    }
  }
  std::sort(scores.begin(), scores.end(), [](auto& a, auto& b) { return a.residual < b.residual; });
  // Return the best traversal per distinct constellation; nearby duplicate traversals do not create ambiguity.
  std::map<std::string, Score> unique;
  for (auto s : scores) {
    auto it = unique.find(s.p->constellationId);
    if (it == unique.end()) unique.emplace(s.p->constellationId, s);
  }
  for (auto& kv : unique) result.push_back(kv.second);
  std::sort(result.begin(), result.end(), [](auto& a, auto& b) { return a.residual < b.residual; });
  return true;
}

static void write_candidate_json(std::ostream& os, const Score& s) {
  os << "{\"patternId\":\"" << s.p->id << "\",\"constellationId\":\"" << s.p->constellationId
     << "\",\"patternName\":\"" << s.p->name << "\",\"residual\":" << s.residual
     << ",\"isVerified\":true,\"rotationDeg\":" << s.angle << ",\"scale\":" << s.scale << "}";
}

static void write_recognition_json(std::ostream& os, const std::vector<Score>& result) {
  const char* status = costellar_score_rules::classify_match_status(
      result.size(),
      result.empty() ? 0.0 : result[0].residual,
      result.size() > 1 ? result[1].residual : 0.0);
  os << std::fixed << std::setprecision(6)
     << "{\"status\":\"" << status << "\",\"candidates\":[";
  for (size_t i = 0; i < result.size(); ++i) {
    if (i) os << ",";
    write_candidate_json(os, result[i]);
  }
  os << "],\"bestMatch\":";
  if (result.empty()) {
    os << "null";
  } else {
    write_candidate_json(os, result[0]);
  }
  os << "}\n";
}

namespace {

int run_legacy_text() {
  int n=0; if(!(std::cin>>n) || n<3 || n>128){std::cout<<kNoMatchJson;return 0;}
  std::vector<Point> input(n); for(auto& p:input) if(!(std::cin>>p.x>>p.y) || !std::isfinite(p.x)||!std::isfinite(p.y)||std::abs(p.x)>1e6||std::abs(p.y)>1e6){std::cout<<kNoMatchJson;return 0;}
  std::vector<Score> result;
  if (!compute_matches(input, result)) {
    std::cout << kNoMatchJson;
    return 0;
  }
  write_recognition_json(std::cout, result);
  return 0;
}

#ifdef COSTELLAR_OFFLINE_BENCH

std::string recognize_points_json(const std::vector<Point>& input) {
  std::vector<Score> result;
  if (!compute_matches(input, result)) return kNoMatchJson;
  std::ostringstream oss;
  oss.imbue(std::locale::classic());
  write_recognition_json(oss, result);
  const std::string out = oss.str();
  if (out.size() > kMaxOutputBytes) return kNoMatchJson;
  return out;
}

class StrictJsonParser {
 public:
  explicit StrictJsonParser(const std::string& src) : src_(src), pos_(0) {}

  bool parse_request(std::vector<Point>& out_points) {
    out_points.clear();
    skip_ws();
    if (!consume('{')) return false;
    skip_ws();
    if (peek() == '}') return false;

    bool has_points = false;
    while (true) {
      std::string key;
      if (!parse_string(key)) return false;
      skip_ws();
      if (!consume(':')) return false;
      skip_ws();

      if (key == "points") {
        if (has_points) return false;
        has_points = true;
        if (!parse_points_array(out_points)) return false;
      } else {
        if (!skip_value(1)) return false;
      }

      skip_ws();
      if (consume('}')) break;
      if (!consume(',')) return false;
      skip_ws();
    }

    skip_ws();
    return has_points && pos_ == src_.size();
  }

 private:
  const std::string& src_;
  size_t pos_;

  char peek() const { return pos_ < src_.size() ? src_[pos_] : '\0'; }

  bool consume(char expected) {
    if (pos_ < src_.size() && src_[pos_] == expected) {
      ++pos_;
      return true;
    }
    return false;
  }

  void skip_ws() {
    while (pos_ < src_.size()) {
      const char c = src_[pos_];
      if (c == ' ' || c == '\t' || c == '\n' || c == '\r') {
        ++pos_;
      } else {
        break;
      }
    }
  }

  static bool is_digit(char c) { return c >= '0' && c <= '9'; }

  static int hex_val(char c) {
    if (c >= '0' && c <= '9') return c - '0';
    if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
    if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
    return -1;
  }

  bool parse_hex4(unsigned int& out) {
    if (pos_ + 4 > src_.size()) return false;
    out = 0;
    for (int i = 0; i < 4; ++i) {
      const int v = hex_val(src_[pos_++]);
      if (v < 0) return false;
      out = (out << 4) | static_cast<unsigned int>(v);
    }
    return true;
  }

  static void append_utf8(std::string& out, unsigned int cp) {
    if (cp <= 0x7F) {
      out.push_back(static_cast<char>(cp));
    } else if (cp <= 0x7FF) {
      out.push_back(static_cast<char>(0xC0 | ((cp >> 6) & 0x1F)));
      out.push_back(static_cast<char>(0x80 | (cp & 0x3F)));
    } else if (cp <= 0xFFFF) {
      out.push_back(static_cast<char>(0xE0 | ((cp >> 12) & 0x0F)));
      out.push_back(static_cast<char>(0x80 | ((cp >> 6) & 0x3F)));
      out.push_back(static_cast<char>(0x80 | (cp & 0x3F)));
    } else {
      out.push_back(static_cast<char>(0xF0 | ((cp >> 18) & 0x07)));
      out.push_back(static_cast<char>(0x80 | ((cp >> 12) & 0x3F)));
      out.push_back(static_cast<char>(0x80 | ((cp >> 6) & 0x3F)));
      out.push_back(static_cast<char>(0x80 | (cp & 0x3F)));
    }
  }

  bool parse_string(std::string& out) {
    out.clear();
    if (!consume('"')) return false;
    while (pos_ < src_.size()) {
      const unsigned char c = static_cast<unsigned char>(src_[pos_++]);
      if (c == '"') return true;
      if (c < 0x20) return false;
      if (c != '\\') {
        out.push_back(static_cast<char>(c));
        continue;
      }
      if (pos_ >= src_.size()) return false;
      const char esc = src_[pos_++];
      switch (esc) {
        case '"': out.push_back('"'); break;
        case '\\': out.push_back('\\'); break;
        case '/': out.push_back('/'); break;
        case 'b': out.push_back('\b'); break;
        case 'f': out.push_back('\f'); break;
        case 'n': out.push_back('\n'); break;
        case 'r': out.push_back('\r'); break;
        case 't': out.push_back('\t'); break;
        case 'u': {
          unsigned int cp = 0;
          if (!parse_hex4(cp)) return false;
          if (cp >= 0xD800 && cp <= 0xDBFF) {
            if (pos_ + 2 > src_.size() || src_[pos_] != '\\' || src_[pos_ + 1] != 'u') return false;
            pos_ += 2;
            unsigned int low = 0;
            if (!parse_hex4(low) || low < 0xDC00 || low > 0xDFFF) return false;
            cp = 0x10000 + (((cp - 0xD800) << 10) | (low - 0xDC00));
          } else if (cp >= 0xDC00 && cp <= 0xDFFF) {
            return false;
          }
          append_utf8(out, cp);
          break;
        }
        default:
          return false;
      }
    }
    return false;
  }

  bool parse_number(double& out) {
    const size_t start = pos_;
    if (pos_ < src_.size() && src_[pos_] == '-') ++pos_;
    if (pos_ >= src_.size()) return false;

    if (src_[pos_] == '0') {
      ++pos_;
      if (pos_ < src_.size() && is_digit(src_[pos_])) return false;
    } else if (src_[pos_] >= '1' && src_[pos_] <= '9') {
      while (pos_ < src_.size() && is_digit(src_[pos_])) ++pos_;
    } else {
      return false;
    }

    if (pos_ < src_.size() && src_[pos_] == '.') {
      ++pos_;
      if (pos_ >= src_.size() || !is_digit(src_[pos_])) return false;
      while (pos_ < src_.size() && is_digit(src_[pos_])) ++pos_;
    }

    if (pos_ < src_.size() && (src_[pos_] == 'e' || src_[pos_] == 'E')) {
      ++pos_;
      if (pos_ < src_.size() && (src_[pos_] == '+' || src_[pos_] == '-')) ++pos_;
      if (pos_ >= src_.size() || !is_digit(src_[pos_])) return false;
      while (pos_ < src_.size() && is_digit(src_[pos_])) ++pos_;
    }

    const std::string token = src_.substr(start, pos_ - start);
    errno = 0;
    char* end_ptr = nullptr;
    const double val = std::strtod(token.c_str(), &end_ptr);
    if (end_ptr != token.c_str() + token.size() || !std::isfinite(val)) {
      return false;
    }
    if (errno == ERANGE && val != 0.0 && std::abs(val) >= 1.0) {
      return false;
    }
    out = val;
    return true;
  }

  bool parse_point_object(Point& pt) {
    if (!consume('{')) return false;
    skip_ws();
    if (peek() == '}') return false;

    bool has_x = false;
    bool has_y = false;
    while (true) {
      std::string key;
      if (!parse_string(key)) return false;
      skip_ws();
      if (!consume(':')) return false;
      skip_ws();

      if (key == "x") {
        if (has_x || !parse_number(pt.x)) return false;
        has_x = true;
      } else if (key == "y") {
        if (has_y || !parse_number(pt.y)) return false;
        has_y = true;
      } else {
        if (!skip_value(2)) return false;
      }

      skip_ws();
      if (consume('}')) break;
      if (!consume(',')) return false;
      skip_ws();
    }

    return has_x && has_y && std::isfinite(pt.x) && std::isfinite(pt.y) &&
           std::abs(pt.x) <= 1e6 && std::abs(pt.y) <= 1e6;
  }

  bool parse_points_array(std::vector<Point>& out_points) {
    if (!consume('[')) return false;
    skip_ws();
    if (peek() == ']') return false;

    while (true) {
      if (out_points.size() >= 128) return false;
      Point pt{0.0, 0.0};
      if (!parse_point_object(pt)) return false;
      out_points.push_back(pt);

      skip_ws();
      if (consume(']')) break;
      if (!consume(',')) return false;
      skip_ws();
    }

    return out_points.size() >= 3 && out_points.size() <= 128;
  }

  bool match_literal(const char* lit, size_t len) {
    if (pos_ + len > src_.size()) return false;
    for (size_t i = 0; i < len; ++i) {
      if (src_[pos_ + i] != lit[i]) return false;
    }
    pos_ += len;
    return true;
  }

  bool skip_value(int depth) {
    if (depth > kMaxJsonDepth) return false;
    skip_ws();
    const char c = peek();
    if (c == '"') {
      std::string ignored;
      return parse_string(ignored);
    }
    if (c == '{') {
      ++pos_;
      skip_ws();
      if (consume('}')) return true;
      while (true) {
        std::string ignored_key;
        if (!parse_string(ignored_key)) return false;
        skip_ws();
        if (!consume(':')) return false;
        if (!skip_value(depth + 1)) return false;
        skip_ws();
        if (consume('}')) return true;
        if (!consume(',')) return false;
        skip_ws();
      }
    }
    if (c == '[') {
      ++pos_;
      skip_ws();
      if (consume(']')) return true;
      while (true) {
        if (!skip_value(depth + 1)) return false;
        skip_ws();
        if (consume(']')) return true;
        if (!consume(',')) return false;
        skip_ws();
      }
    }
    if (c == 't') return match_literal("true", 4);
    if (c == 'f') return match_literal("false", 5);
    if (c == 'n') return match_literal("null", 4);
    if (c == '-' || is_digit(c)) {
      double ignored_num = 0.0;
      return parse_number(ignored_num);
    }
    return false;
  }
};

bool read_bounded_line(std::istream& in, std::string& line, bool& oversized) {
  line.clear();
  oversized = false;
  int ch = in.get();
  if (ch == std::char_traits<char>::eof()) return false;
  while (ch != std::char_traits<char>::eof()) {
    if (ch == '\n') {
      if (!line.empty() && line.back() == '\r') line.pop_back();
      return true;
    }
    if (line.size() >= kMaxRequestBytes) {
      oversized = true;
      while (ch != std::char_traits<char>::eof() && ch != '\n') {
        ch = in.get();
      }
      return true;
    }
    line.push_back(static_cast<char>(ch));
    ch = in.get();
  }
  return true;
}

std::string evaluate_ndjson_line(const std::string& line, bool oversized) {
  if (oversized) return kNoMatchJson;
  std::vector<Point> input;
  StrictJsonParser parser(line);
  if (!parser.parse_request(input)) return kNoMatchJson;
  return recognize_points_json(input);
}

int run_oneshot_ndjson() {
  std::string line;
  bool oversized = false;
  const bool has_line = read_bounded_line(std::cin, line, oversized);
  std::cout << (has_line ? evaluate_ndjson_line(line, oversized) : kNoMatchJson);
  std::cout.flush();
  return std::cout ? 0 : 1;
}

int run_retained_ndjson() {
  std::string line;
  bool oversized = false;
  while (read_bounded_line(std::cin, line, oversized)) {
    std::cout << evaluate_ndjson_line(line, oversized);
    std::cout.flush();
    if (!std::cout) return 1;
  }
  return 0;
}

#endif  // COSTELLAR_OFFLINE_BENCH

}  // namespace

#ifdef COSTELLAR_OFFLINE_BENCH
int main(int argc, char** argv) {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);
  if (argc <= 1) return run_legacy_text();
  if (argc == 2 && argv[1] != nullptr) {
    const std::string mode(argv[1]);
    if (mode == "--oneshot-ndjson") return run_oneshot_ndjson();
    if (mode == "--retained-ndjson") return run_retained_ndjson();
  }
  std::cout << kNoMatchJson;
  std::cout.flush();
  return 1;
}
#else
int main() {
  std::ios::sync_with_stdio(false);
  std::cin.tie(nullptr);
  return run_legacy_text();
}
#endif
