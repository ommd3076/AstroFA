#include <algorithm>
#include <cerrno>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <filesystem>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <locale>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>
#include <utility>
#include <vector>
#include "catalog.generated.hpp"
#include "recognizer_score_rules.hpp"

#if (defined(_MSVC_LANG) ? _MSVC_LANG : __cplusplus) < 201703L
#error "recognizer_bench requires C++17 or newer"
#endif

#ifdef __FAST_MATH__
#error "recognizer_bench must be compiled with -fno-fast-math"
#endif

#if defined(_WIN32)
#ifndef _WIN32_WINNT
#define _WIN32_WINNT 0x0601
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>
#include <psapi.h>
#if defined(_MSC_VER) && (defined(_M_X64) || defined(_M_IX86))
#include <intrin.h>
#elif (defined(__GNUC__) || defined(__clang__)) && (defined(__x86_64__) || defined(__i386__))
#include <cpuid.h>
#endif
#elif defined(__unix__) || defined(__APPLE__)
#include <csignal>
#include <fcntl.h>
#include <poll.h>
#include <sys/resource.h>
#include <sys/types.h>
#include <sys/utsname.h>
#include <sys/wait.h>
#include <unistd.h>
#if defined(__APPLE__)
#include <sys/sysctl.h>
#endif
#define COSTELLAR_POSIX_PIPES 1
#else
#error "Unsupported platform for native benchmark harness"
#endif

namespace {

constexpr size_t kDefaultWarmups = 20;
constexpr size_t kDefaultBlocks = 20;
constexpr size_t kDefaultBlockSize = 50;
constexpr size_t kDefaultBootstraps = 10000;
constexpr uint64_t kDefaultWorkloadSeed = 0xC057E11A5EED0001ULL;
constexpr uint64_t kDefaultBootstrapSeed = 0xB007572A900D0002ULL;
constexpr size_t kMaxRequestBytes = 32768;
constexpr size_t kMaxOutputBytes = 1048576;
constexpr int kWorkerTimeoutMs = 5000;

struct Sha256 {
  uint32_t state[8];
  uint64_t bit_len = 0;
  uint8_t buf[64]{};
  size_t buf_len = 0;

  Sha256() {
    state[0] = 0x6a09e667u;
    state[1] = 0xbb67ae85u;
    state[2] = 0x3c6ef372u;
    state[3] = 0xa54ff53au;
    state[4] = 0x510e527fu;
    state[5] = 0x9b05688cu;
    state[6] = 0x1f83d9abu;
    state[7] = 0x5be0cd19u;
  }

  static uint32_t rotr(uint32_t x, uint32_t n) { return (x >> n) | (x << (32 - n)); }

  void transform(const uint8_t block[64]) {
    static constexpr uint32_t kK[64] = {
        0x428a2f98u, 0x71374491u, 0xb5c0fbcfu, 0xe9b5dba5u, 0x3956c25bu, 0x59f111f1u, 0x923f82a4u,
        0xab1c5ed5u, 0xd807aa98u, 0x12835b01u, 0x243185beu, 0x550c7dc3u, 0x72be5d74u, 0x80deb1feu,
        0x9bdc06a7u, 0xc19bf174u, 0xe49b69c1u, 0xefbe4786u, 0x0fc19dc6u, 0x240ca1ccu, 0x2de92c6fu,
        0x4a7484aau, 0x5cb0a9dcu, 0x76f988dau, 0x983e5152u, 0xa831c66du, 0xb00327c8u, 0xbf597fc7u,
        0xc6e00bf3u, 0xd5a79147u, 0x06ca6351u, 0x14292967u, 0x27b70a85u, 0x2e1b2138u, 0x4d2c6dfcu,
        0x53380d13u, 0x650a7354u, 0x766a0abbu, 0x81c2c92eu, 0x92722c85u, 0xa2bfe8a1u, 0xa81a664bu,
        0xc24b8b70u, 0xc76c51a3u, 0xd192e819u, 0xd6990624u, 0xf40e3585u, 0x106aa070u, 0x19a4c116u,
        0x1e376c08u, 0x2748774cu, 0x34b0bcb5u, 0x391c0cb3u, 0x4ed8aa4au, 0x5b9cca4fu, 0x682e6ff3u,
        0x748f82eeu, 0x78a5636fu, 0x84c87814u, 0x8cc70208u, 0x90befffau, 0xa4506cebu, 0xbef9a3f7u,
        0xc67178f2u};
    uint32_t w[64];
    for (int i = 0; i < 16; ++i) {
      w[i] = (static_cast<uint32_t>(block[i * 4]) << 24) |
             (static_cast<uint32_t>(block[i * 4 + 1]) << 16) |
             (static_cast<uint32_t>(block[i * 4 + 2]) << 8) |
             static_cast<uint32_t>(block[i * 4 + 3]);
    }
    for (int i = 16; i < 64; ++i) {
      const uint32_t s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >> 3);
      const uint32_t s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >> 10);
      w[i] = w[i - 16] + s0 + w[i - 7] + s1;
    }
    uint32_t a = state[0], b = state[1], c = state[2], d = state[3];
    uint32_t e = state[4], f = state[5], g = state[6], h = state[7];
    for (int i = 0; i < 64; ++i) {
      const uint32_t S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const uint32_t ch = (e & f) ^ ((~e) & g);
      const uint32_t temp1 = h + S1 + ch + kK[i] + w[i];
      const uint32_t S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const uint32_t maj = (a & b) ^ (a & c) ^ (b & c);
      const uint32_t temp2 = S0 + maj;
      h = g;
      g = f;
      f = e;
      e = d + temp1;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2;
    }
    state[0] += a;
    state[1] += b;
    state[2] += c;
    state[3] += d;
    state[4] += e;
    state[5] += f;
    state[6] += g;
    state[7] += h;
  }

  void update(const void* data, size_t len) {
    const auto* p = static_cast<const uint8_t*>(data);
    for (size_t i = 0; i < len; ++i) {
      buf[buf_len++] = p[i];
      if (buf_len == 64) {
        transform(buf);
        bit_len += 512;
        buf_len = 0;
      }
    }
  }

  void update_str(const std::string& s) { update(s.data(), s.size()); }

  std::string finish_hex() {
    const uint64_t total_bits = bit_len + static_cast<uint64_t>(buf_len) * 8ULL;
    buf[buf_len++] = 0x80u;
    if (buf_len > 56) {
      while (buf_len < 64) buf[buf_len++] = 0;
      transform(buf);
      buf_len = 0;
    }
    while (buf_len < 56) buf[buf_len++] = 0;
    for (int i = 7; i >= 0; --i) {
      buf[buf_len++] = static_cast<uint8_t>((total_bits >> (i * 8)) & 0xFFu);
    }
    transform(buf);
    static constexpr char kHex[] = "0123456789abcdef";
    std::string out;
    out.reserve(64);
    for (uint32_t v : state) {
      for (int shift = 28; shift >= 0; shift -= 4) {
        out.push_back(kHex[(v >> shift) & 0xFu]);
      }
    }
    return out;
  }
};

bool sha256_file(const std::string& path, std::string& out_hex) {
  std::ifstream ifs(path, std::ios::binary);
  if (!ifs) return false;
  Sha256 h;
  char chunk[8192];
  while (ifs) {
    ifs.read(chunk, sizeof(chunk));
    const std::streamsize got = ifs.gcount();
    if (got > 0) h.update(chunk, static_cast<size_t>(got));
  }
  out_hex = h.finish_hex();
  return true;
}

std::string json_escape(const std::string& s) {
  std::string out;
  out.reserve(s.size() + 8);
  for (unsigned char c : s) {
    switch (c) {
      case '"': out += "\\\""; break;
      case '\\': out += "\\\\"; break;
      case '\b': out += "\\b"; break;
      case '\f': out += "\\f"; break;
      case '\n': out += "\\n"; break;
      case '\r': out += "\\r"; break;
      case '\t': out += "\\t"; break;
      default:
        if (c < 0x20) {
          char buf[8];
          std::snprintf(buf, sizeof(buf), "\\u%04x", static_cast<unsigned int>(c));
          out += buf;
        } else {
          out.push_back(static_cast<char>(c));
        }
        break;
    }
  }
  return out;
}

struct SplitMix64 {
  uint64_t state;
  explicit SplitMix64(uint64_t seed) : state(seed) {}

  uint64_t next_u64() {
    uint64_t z = (state += 0x9e3779b97f4a7c15ULL);
    z = (z ^ (z >> 30)) * 0xbf58476d1ce4e5b9ULL;
    z = (z ^ (z >> 27)) * 0x94d049bb133111ebuLL;
    return z ^ (z >> 31);
  }

  double next_unit() {
    return static_cast<double>(next_u64() >> 11) * (1.0 / 9007199254740992.0);
  }

  double next_signed() { return next_unit() * 2.0 - 1.0; }

  size_t next_index(size_t bound) {
    if (bound <= 1) return 0;
    const uint64_t limit = UINT64_MAX - (UINT64_MAX % static_cast<uint64_t>(bound));
    while (true) {
      const uint64_t r = next_u64();
      if (r < limit) return static_cast<size_t>(r % static_cast<uint64_t>(bound));
    }
  }
};

struct WorkloadItem {
  std::string category;
  size_t point_count = 0;
  std::string ndjson_line;
};

std::string serialize_ndjson(const std::vector<Point>& pts, size_t pad_spaces = 0) {
  std::ostringstream oss;
  oss.imbue(std::locale::classic());
  oss << std::setprecision(15) << "{\"points\":[";
  for (size_t i = 0; i < pts.size(); ++i) {
    if (i) oss << ",";
    oss << "{\"x\":" << pts[i].x << ",\"y\":" << pts[i].y << "}";
  }
  oss << "]}";
  if (pad_spaces > 0) oss << std::string(pad_spaces, ' ');
  oss << "\n";
  return oss.str();
}

std::vector<Point> transform_pattern(const Pattern& pat, SplitMix64& rng, double noise_fraction) {
  double sum_sq = 0.0;
  for (const auto& p : pat.points) sum_sq += p.x * p.x + p.y * p.y;
  const double radius = std::sqrt(sum_sq / static_cast<double>(pat.points.size()));
  const double noise = radius * noise_fraction;
  const double angle = rng.next_signed() * 3.14159265358979323846;
  const double scale = 0.5 + 3.5 * rng.next_unit();
  const double tx = rng.next_signed() * 500.0;
  const double ty = rng.next_signed() * 500.0;
  const double c = std::cos(angle);
  const double s = std::sin(angle);
  std::vector<Point> out;
  out.reserve(pat.points.size());
  for (const auto& p : pat.points) {
    out.push_back({scale * (c * p.x - s * p.y) + tx + noise * rng.next_signed(),
                   scale * (s * p.x + c * p.y) + ty + noise * rng.next_signed()});
  }
  return out;
}

std::vector<Point> synthetic_nomatch_points(size_t n, SplitMix64& rng) {
  std::vector<Point> out;
  out.reserve(n);
  const double phase = rng.next_signed() * 3.14159265358979323846;
  const double radius = 20.0 + 180.0 * rng.next_unit();
  for (size_t i = 0; i < n; ++i) {
    const double t = static_cast<double>(i) / static_cast<double>(n);
    const double ang = phase + 2.0 * 3.14159265358979323846 * t;
    const double wobble = (i % 2 == 0 ? 1.0 : 0.45) + 0.1 * rng.next_signed();
    out.push_back({radius * wobble * std::cos(ang), radius * wobble * std::sin(ang)});
  }
  return out;
}

WorkloadItem make_matched_item(const std::vector<const Pattern*>& pool, SplitMix64& rng,
                               const std::string& label) {
  const Pattern* pat = pool[rng.next_index(pool.size())];
  const auto pts = transform_pattern(*pat, rng, 0.005);
  return {label, pts.size(), serialize_ndjson(pts)};
}

WorkloadItem make_degenerate_item(size_t variant, SplitMix64& rng) {
  switch (variant % 6) {
    case 0:
      return {"degenerate_zero_norm_3", 3,
              serialize_ndjson({{5.0, 5.0}, {5.0, 5.0}, {5.0, 5.0}})};
    case 1: {
      std::vector<Point> pts(32, {12.5, -4.0});
      return {"degenerate_zero_norm_32", 32, serialize_ndjson(pts)};
    }
    case 2:
      return {"degenerate_zero_edge", 4,
              serialize_ndjson({{0.0, 0.0}, {0.0, 0.0}, {10.0, 0.0}, {10.0, 10.0}})};
    case 3:
      return {"degenerate_too_few", 2, serialize_ndjson({{0.0, 0.0}, {10.0, 10.0}})};
    case 4:
      return {"degenerate_out_of_bounds", 3,
              serialize_ndjson({{0.0, 0.0}, {1000001.0, 0.0}, {0.0, 50.0}})};
    default: {
      const char* malformed[] = {
          "{\"points\":[{\"x\":NaN,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
          "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0}\n",
          "not-json\n",
      };
      return {"malformed_json", 0, malformed[rng.next_index(3)]};
    }
  }
}

std::vector<WorkloadItem> build_block_workload(uint64_t seed, size_t block_size) {
  SplitMix64 rng(seed);
  std::vector<const Pattern*> all_pats;
  std::vector<const Pattern*> high_cand_pats;
  for (const auto& p : kPatterns) {
    all_pats.push_back(&p);
    if (p.points.size() == 5 || p.points.size() == 6) high_cand_pats.push_back(&p);
  }
  if (high_cand_pats.empty()) high_cand_pats = all_pats;

  std::vector<WorkloadItem> items;
  items.reserve(block_size);
  const size_t counts[] = {3, 6, 12, 32, 64, 128};
  for (size_t i = 0; i < block_size; ++i) {
    if (i < 10) {
      items.push_back(make_matched_item(high_cand_pats, rng, "matched_high_candidate"));
    } else if (i < 18) {
      items.push_back(make_matched_item(all_pats, rng, "matched_catalog"));
    } else if (i < 42) {
      const size_t n = counts[(i - 18) % 6];
      items.push_back({"nomatch_" + std::to_string(n), n,
                       serialize_ndjson(synthetic_nomatch_points(n, rng))});
    } else if (i == 42) {
      // Near-32 KiB valid 128-point request (~30 KiB payload, strictly <= 32768).
      std::string s = serialize_ndjson(synthetic_nomatch_points(128, rng));
      const size_t body_len = s.size() - 1;
      if (body_len < 30720) {
        s = s.substr(0, body_len) + std::string(30720 - body_len, ' ') + "\n";
      }
      items.push_back({"near_32k_128", 128, std::move(s)});
    } else {
      items.push_back(make_degenerate_item(i - 43, rng));
    }
  }
  // Deterministic Fisher-Yates shuffle across the block.
  for (size_t i = items.size(); i > 1; --i) {
    const size_t j = rng.next_index(i);
    std::swap(items[i - 1], items[j]);
  }
  return items;
}

bool valid_worker_response_json(const std::string& line) {
  if (line.empty() || line.size() > kMaxOutputBytes || line.back() != '\n') return false;
  const size_t status_pos = line.find("{\"status\":\"");
  if (status_pos != 0) return false;
  const size_t status_end = line.find('"', 11);
  if (status_end == std::string::npos) return false;
  const std::string status = line.substr(11, status_end - 11);
  if (status != "FULL_MATCH" && status != "AMBIGUOUS" && status != "NO_MATCH") return false;
  if (line.find("],\"bestMatch\":") == std::string::npos) return false;
  return line.size() >= 2 && line[line.size() - 2] == '}';
}

struct PipeLineReader {
  std::string buf;
  size_t pos = 0;

  void reset() {
    buf.clear();
    pos = 0;
  }

  bool has_pending() const { return pos < buf.size(); }

#if defined(_WIN32)
  bool read_line(HANDLE fd, size_t max_bytes, std::string& out) {
    out.clear();
    const size_t nl0 = buf.find('\n', pos);
    if (nl0 != std::string::npos) {
      const size_t len = nl0 - pos + 1;
      if (len > max_bytes) return false;
      out.assign(buf, pos, len);
      pos = nl0 + 1;
      if (pos == buf.size()) reset();
      return true;
    }
    char tmp[4096];
    while (true) {
      const size_t pending = buf.size() - pos;
      if (pending >= max_bytes) return false;
      DWORD got = 0;
      if (!ReadFile(fd, tmp, static_cast<DWORD>(sizeof(tmp)), &got, nullptr) || got == 0) {
        return false;
      }
      const size_t n = static_cast<size_t>(got);
      for (size_t i = 0; i < n; ++i) {
        if (tmp[i] == '\n') {
          const size_t line_len = pending + i + 1;
          if (line_len > max_bytes) return false;
          out.assign(buf, pos, pending);
          out.append(tmp, i + 1);
          if (i + 1 < n) {
            buf.assign(tmp + i + 1, n - (i + 1));
            pos = 0;
          } else {
            reset();
          }
          return true;
        }
      }
      if (pending + n > max_bytes) return false;
      if (pos > 4096) {
        buf.erase(0, pos);
        pos = 0;
      }
      buf.append(tmp, n);
    }
  }
#elif defined(COSTELLAR_POSIX_PIPES)
  bool read_line(int fd, size_t max_bytes, std::chrono::steady_clock::time_point deadline,
                 std::string& out) {
    out.clear();
    const size_t nl0 = buf.find('\n', pos);
    if (nl0 != std::string::npos) {
      const size_t len = nl0 - pos + 1;
      if (len > max_bytes) return false;
      out.assign(buf, pos, len);
      pos = nl0 + 1;
      if (pos == buf.size()) reset();
      return true;
    }
    char tmp[4096];
    while (true) {
      const size_t pending = buf.size() - pos;
      if (pending >= max_bytes) return false;
      const auto now = std::chrono::steady_clock::now();
      if (now >= deadline) return false;
      const int rem_ms = static_cast<int>(
          std::max<int64_t>(1, std::chrono::duration_cast<std::chrono::milliseconds>(deadline - now).count()));
      struct pollfd pfd {};
      pfd.fd = fd;
      pfd.events = POLLIN;
      const int pr = poll(&pfd, 1, rem_ms);
      if (pr < 0) {
        if (errno == EINTR) continue;
        return false;
      }
      if (pr == 0) return false;
      const ssize_t r = read(fd, tmp, sizeof(tmp));
      if (r < 0) {
        if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
        return false;
      }
      if (r == 0) return false;
      const size_t n = static_cast<size_t>(r);
      for (size_t i = 0; i < n; ++i) {
        if (tmp[i] == '\n') {
          const size_t line_len = pending + i + 1;
          if (line_len > max_bytes) return false;
          out.assign(buf, pos, pending);
          out.append(tmp, i + 1);
          if (i + 1 < n) {
            buf.assign(tmp + i + 1, n - (i + 1));
            pos = 0;
          } else {
            reset();
          }
          return true;
        }
      }
      if (pending + n > max_bytes) return false;
      if (pos > 4096) {
        buf.erase(0, pos);
        pos = 0;
      }
      buf.append(tmp, n);
    }
  }
#endif
};

struct ResourceSample {
  bool cpu_supported = false;
  double cpu_ms = 0.0;
  bool rss_supported = false;
  uint64_t rss_bytes = 0;
  uint64_t peak_rss_bytes = 0;
};

#if defined(_WIN32)
using GetProcessMemoryInfoFn = BOOL(WINAPI*)(HANDLE, PROCESS_MEMORY_COUNTERS*, DWORD);

GetProcessMemoryInfoFn resolve_win_mem_fn() {
  static GetProcessMemoryInfoFn fn = []() -> GetProcessMemoryInfoFn {
    HMODULE k32 = GetModuleHandleW(L"kernel32.dll");
    if (k32 != nullptr) {
      auto p = reinterpret_cast<GetProcessMemoryInfoFn>(
          reinterpret_cast<void*>(GetProcAddress(k32, "K32GetProcessMemoryInfo")));
      if (p != nullptr) return p;
    }
    HMODULE psapi = LoadLibraryW(L"psapi.dll");
    if (psapi != nullptr) {
      auto p = reinterpret_cast<GetProcessMemoryInfoFn>(
          reinterpret_cast<void*>(GetProcAddress(psapi, "GetProcessMemoryInfo")));
      if (p != nullptr) return p;
    }
    return nullptr;
  }();
  return fn;
}

ResourceSample sample_process_win(HANDLE proc) {
  ResourceSample s;
  FILETIME create_t{}, exit_t{}, kernel_t{}, user_t{};
  if (GetProcessTimes(proc, &create_t, &exit_t, &kernel_t, &user_t)) {
    const uint64_t k = (static_cast<uint64_t>(kernel_t.dwHighDateTime) << 32) |
                       static_cast<uint64_t>(kernel_t.dwLowDateTime);
    const uint64_t u = (static_cast<uint64_t>(user_t.dwHighDateTime) << 32) |
                       static_cast<uint64_t>(user_t.dwLowDateTime);
    s.cpu_supported = true;
    s.cpu_ms = static_cast<double>(k + u) * 1e-4;
  }
  auto mem_fn = resolve_win_mem_fn();
  if (mem_fn != nullptr) {
    PROCESS_MEMORY_COUNTERS pmc{};
    pmc.cb = sizeof(pmc);
    if (mem_fn(proc, &pmc, sizeof(pmc))) {
      s.rss_supported = true;
      s.rss_bytes = static_cast<uint64_t>(pmc.WorkingSetSize);
      s.peak_rss_bytes = static_cast<uint64_t>(pmc.PeakWorkingSetSize);
    }
  }
  return s;
}

std::wstring utf8_to_wide(const std::string& s) {
  if (s.empty()) return std::wstring();
  const int len = MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), nullptr, 0);
  if (len <= 0) return std::wstring(s.begin(), s.end());
  std::wstring out(static_cast<size_t>(len), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), &out[0], len);
  return out;
}

std::wstring quote_win_arg(const std::wstring& arg) {
  if (!arg.empty() && arg.find_first_of(L" \t\n\v\"") == std::wstring::npos) return arg;
  std::wstring out = L"\"";
  for (size_t i = 0; i < arg.size(); ++i) {
    size_t backslashes = 0;
    while (i < arg.size() && arg[i] == L'\\') {
      ++backslashes;
      ++i;
    }
    if (i == arg.size()) {
      out.append(backslashes * 2, L'\\');
      break;
    }
    if (arg[i] == L'"') {
      out.append(backslashes * 2 + 1, L'\\');
      out.push_back(L'"');
    } else {
      out.append(backslashes, L'\\');
      out.push_back(arg[i]);
    }
  }
  out.push_back(L'"');
  return out;
}

class DeadlineWatchdog {
 public:
  DeadlineWatchdog() {
    DuplicateHandle(GetCurrentProcess(), GetCurrentThread(), GetCurrentProcess(), &owner_thread_, 0,
                    FALSE, DUPLICATE_SAME_ACCESS);
    stop_event_ = CreateEventW(nullptr, TRUE, FALSE, nullptr);
    thread_ = std::thread([this]() { run(); });
  }

  ~DeadlineWatchdog() {
    if (stop_event_ != nullptr) SetEvent(stop_event_);
    if (thread_.joinable()) thread_.join();
    if (stop_event_ != nullptr) CloseHandle(stop_event_);
    if (owner_thread_ != nullptr) CloseHandle(owner_thread_);
  }

  DeadlineWatchdog(const DeadlineWatchdog&) = delete;
  DeadlineWatchdog& operator=(const DeadlineWatchdog&) = delete;

  void begin_op(HANDLE proc, int timeout_ms) {
    std::lock_guard<std::mutex> lk(mu_);
    active_proc_ = proc;
    deadline_ = std::chrono::steady_clock::now() + std::chrono::milliseconds(timeout_ms);
    timed_out_ = false;
    in_flight_ = true;
  }

  bool end_op() {
    std::lock_guard<std::mutex> lk(mu_);
    in_flight_ = false;
    active_proc_ = nullptr;
    return timed_out_;
  }

 private:
  void run() {
    while (WaitForSingleObject(stop_event_, 25) == WAIT_TIMEOUT) {
      std::lock_guard<std::mutex> lk(mu_);
      if (in_flight_ && !timed_out_ && std::chrono::steady_clock::now() >= deadline_) {
        timed_out_ = true;
        if (active_proc_ != nullptr) TerminateProcess(active_proc_, 1);
        if (owner_thread_ != nullptr) CancelSynchronousIo(owner_thread_);
      }
    }
  }

  HANDLE owner_thread_ = nullptr;
  HANDLE stop_event_ = nullptr;
  std::thread thread_;
  std::mutex mu_;
  HANDLE active_proc_ = nullptr;
  std::chrono::steady_clock::time_point deadline_{};
  bool in_flight_ = false;
  bool timed_out_ = false;
};

DeadlineWatchdog& get_watchdog() {
  static DeadlineWatchdog wd;
  return wd;
}

struct ChildPipes {
  HANDLE in_write = INVALID_HANDLE_VALUE;
  HANDLE out_read = INVALID_HANDLE_VALUE;
  HANDLE process = INVALID_HANDLE_VALUE;
  HANDLE thread = INVALID_HANDLE_VALUE;

  void close_all() {
    if (in_write != INVALID_HANDLE_VALUE) {
      CloseHandle(in_write);
      in_write = INVALID_HANDLE_VALUE;
    }
    if (out_read != INVALID_HANDLE_VALUE) {
      CloseHandle(out_read);
      out_read = INVALID_HANDLE_VALUE;
    }
    if (thread != INVALID_HANDLE_VALUE) {
      CloseHandle(thread);
      thread = INVALID_HANDLE_VALUE;
    }
    if (process != INVALID_HANDLE_VALUE) {
      CloseHandle(process);
      process = INVALID_HANDLE_VALUE;
    }
  }
};

bool spawn_worker_win(const std::string& bin, const std::string& flag, ChildPipes& child) {
  child = ChildPipes{};
  SECURITY_ATTRIBUTES sa{};
  sa.nLength = sizeof(sa);
  sa.bInheritHandle = TRUE;
  sa.lpSecurityDescriptor = nullptr;

  HANDLE in_read = INVALID_HANDLE_VALUE;
  HANDLE in_write = INVALID_HANDLE_VALUE;
  HANDLE out_read = INVALID_HANDLE_VALUE;
  HANDLE out_write = INVALID_HANDLE_VALUE;
  if (!CreatePipe(&in_read, &in_write, &sa, 65536)) return false;
  if (!CreatePipe(&out_read, &out_write, &sa, 65536)) {
    CloseHandle(in_read);
    CloseHandle(in_write);
    return false;
  }
  if (!SetHandleInformation(in_write, HANDLE_FLAG_INHERIT, 0) ||
      !SetHandleInformation(out_read, HANDLE_FLAG_INHERIT, 0)) {
    CloseHandle(in_read);
    CloseHandle(in_write);
    CloseHandle(out_read);
    CloseHandle(out_write);
    return false;
  }

  HANDLE err_write = CreateFileW(L"NUL", GENERIC_WRITE, FILE_SHARE_READ | FILE_SHARE_WRITE, &sa,
                                 OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, nullptr);
  std::vector<HANDLE> inherit_list = {in_read, out_write};
  if (err_write != INVALID_HANDLE_VALUE) inherit_list.push_back(err_write);

  SIZE_T attr_size = 0;
  InitializeProcThreadAttributeList(nullptr, 1, 0, &attr_size);
  std::vector<unsigned char> attr_buf(attr_size);
  auto* attr_list = reinterpret_cast<LPPROC_THREAD_ATTRIBUTE_LIST>(attr_buf.data());
  if (!InitializeProcThreadAttributeList(attr_list, 1, 0, &attr_size) ||
      !UpdateProcThreadAttribute(attr_list, 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST,
                                 inherit_list.data(),
                                 static_cast<SIZE_T>(inherit_list.size() * sizeof(HANDLE)),
                                 nullptr, nullptr)) {
    DeleteProcThreadAttributeList(attr_list);
    CloseHandle(in_read);
    CloseHandle(in_write);
    CloseHandle(out_read);
    CloseHandle(out_write);
    if (err_write != INVALID_HANDLE_VALUE) CloseHandle(err_write);
    return false;
  }

  STARTUPINFOEXW si{};
  si.StartupInfo.cb = sizeof(si);
  si.StartupInfo.dwFlags = STARTF_USESTDHANDLES;
  si.StartupInfo.hStdInput = in_read;
  si.StartupInfo.hStdOutput = out_write;
  si.StartupInfo.hStdError = err_write;
  si.lpAttributeList = attr_list;

  std::wstring cmd = quote_win_arg(utf8_to_wide(bin));
  if (!flag.empty()) cmd += L" " + quote_win_arg(utf8_to_wide(flag));
  std::vector<wchar_t> cmd_buf(cmd.begin(), cmd.end());
  cmd_buf.push_back(L'\0');

  PROCESS_INFORMATION pi{};
  const BOOL created = CreateProcessW(nullptr, cmd_buf.data(), nullptr, nullptr, TRUE,
                                      EXTENDED_STARTUPINFO_PRESENT, nullptr, nullptr,
                                      &si.StartupInfo, &pi);

  DeleteProcThreadAttributeList(attr_list);
  CloseHandle(in_read);
  CloseHandle(out_write);
  if (err_write != INVALID_HANDLE_VALUE) CloseHandle(err_write);

  if (!created) {
    CloseHandle(in_write);
    CloseHandle(out_read);
    return false;
  }
  child.in_write = in_write;
  child.out_read = out_read;
  child.process = pi.hProcess;
  child.thread = pi.hThread;
  return true;
}

bool write_all_win(HANDLE fd, const std::string& data) {
  size_t written = 0;
  while (written < data.size()) {
    DWORD chunk = 0;
    const DWORD to_write = static_cast<DWORD>(data.size() - written);
    if (!WriteFile(fd, data.data() + written, to_write, &chunk, nullptr) || chunk == 0) {
      return false;
    }
    written += static_cast<size_t>(chunk);
  }
  return true;
}

bool drain_expect_eof_win(HANDLE fd, PipeLineReader& reader) {
  if (reader.has_pending()) return false;
  char tmp[256];
  DWORD got = 0;
  if (ReadFile(fd, tmp, sizeof(tmp), &got, nullptr)) return got == 0;
  return GetLastError() == ERROR_BROKEN_PIPE;
}

bool run_oneshot_request(const std::string& bin, const std::string& req, std::string& out_line,
                         double& latency_ms, ResourceSample& res, bool& timed_out_out,
                         std::string& err_out) {
  out_line.clear();
  timed_out_out = false;
  err_out.clear();
  if (req.size() > kMaxRequestBytes + 1 || req.empty() || req.back() != '\n') {
    err_out = "request exceeds 32 KiB limit or lacks newline framing";
    return false;
  }

  const auto t0 = std::chrono::steady_clock::now();
  ChildPipes child;
  if (!spawn_worker_win(bin, "--oneshot-ndjson", child)) {
    err_out = "spawn failed for oneshot worker";
    return false;
  }

  auto& wd = get_watchdog();
  wd.begin_op(child.process, kWorkerTimeoutMs);

  bool ok = write_all_win(child.in_write, req);
  CloseHandle(child.in_write);
  child.in_write = INVALID_HANDLE_VALUE;

  PipeLineReader reader;
  if (ok) ok = reader.read_line(child.out_read, kMaxOutputBytes, out_line);
  if (ok) ok = drain_expect_eof_win(child.out_read, reader);

  DWORD exit_code = 1;
  const DWORD wait_rc = WaitForSingleObject(child.process, kWorkerTimeoutMs);
  const bool timed_out = wd.end_op();
  const auto t1 = std::chrono::steady_clock::now();
  latency_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

  if (timed_out) {
    timed_out_out = true;
    err_out = "oneshot worker exceeded 5000ms deadline";
    TerminateProcess(child.process, 1);
    WaitForSingleObject(child.process, 1000);
    child.close_all();
    return false;
  }
  if (!ok || wait_rc != WAIT_OBJECT_0 || !GetExitCodeProcess(child.process, &exit_code) ||
      exit_code != 0) {
    err_out = "oneshot worker I/O failure or non-zero exit";
    TerminateProcess(child.process, 1);
    WaitForSingleObject(child.process, 1000);
    child.close_all();
    return false;
  }
  res = sample_process_win(child.process);
  child.close_all();
  return true;
}

class RetainedWorker {
 public:
  ~RetainedWorker() { abort_kill(); }

  bool start(const std::string& bin, double& spawn_ms, std::string& err_out) {
    const auto t0 = std::chrono::steady_clock::now();
    if (!spawn_worker_win(bin, "--retained-ndjson", child_)) {
      err_out = "spawn failed for retained worker";
      return false;
    }
    const auto t1 = std::chrono::steady_clock::now();
    spawn_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    alive_ = true;
    reader_.reset();
    return true;
  }

  bool request(const std::string& req, std::string& out_line, double& latency_ms,
               bool& timed_out_out, std::string& err_out) {
    out_line.clear();
    timed_out_out = false;
    err_out.clear();
    if (!alive_) {
      err_out = "retained worker not alive";
      return false;
    }
    if (req.size() > kMaxRequestBytes + 1 || req.empty() || req.back() != '\n') {
      err_out = "request exceeds 32 KiB limit or lacks newline framing";
      return false;
    }

    auto& wd = get_watchdog();
    const auto t0 = std::chrono::steady_clock::now();
    wd.begin_op(child_.process, kWorkerTimeoutMs);
    const bool ok =
        write_all_win(child_.in_write, req) &&
        reader_.read_line(child_.out_read, kMaxOutputBytes, out_line);
    const bool timed_out = wd.end_op();
    const auto t1 = std::chrono::steady_clock::now();
    latency_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

    if (timed_out) {
      timed_out_out = true;
      err_out = "retained worker exceeded 5000ms deadline";
      abort_kill();
      return false;
    }
    if (!ok) {
      err_out = "retained worker pipe/output failure";
      abort_kill();
      return false;
    }
    return true;
  }

  ResourceSample sample_live() const {
    if (!alive_ || child_.process == INVALID_HANDLE_VALUE) return ResourceSample{};
    return sample_process_win(child_.process);
  }

  bool close_gracefully(ResourceSample& final_res, bool& timed_out_out, std::string& err_out) {
    timed_out_out = false;
    err_out.clear();
    if (!alive_) return true;
    if (child_.in_write != INVALID_HANDLE_VALUE) {
      CloseHandle(child_.in_write);
      child_.in_write = INVALID_HANDLE_VALUE;
    }
    auto& wd = get_watchdog();
    wd.begin_op(child_.process, kWorkerTimeoutMs);
    const bool clean_eof = drain_expect_eof_win(child_.out_read, reader_);
    const DWORD wait_rc = WaitForSingleObject(child_.process, kWorkerTimeoutMs);
    const bool timed_out = wd.end_op();
    DWORD exit_code = 1;
    if (timed_out) {
      timed_out_out = true;
      err_out = "retained worker shutdown exceeded 5000ms deadline";
      abort_kill();
      return false;
    }
    if (!clean_eof || wait_rc != WAIT_OBJECT_0 ||
        !GetExitCodeProcess(child_.process, &exit_code) || exit_code != 0) {
      err_out = "retained worker non-zero exit or unexpected trailing output on shutdown";
      abort_kill();
      return false;
    }
    final_res = sample_process_win(child_.process);
    child_.close_all();
    alive_ = false;
    return true;
  }

  void abort_kill() {
    if (child_.process != INVALID_HANDLE_VALUE) {
      TerminateProcess(child_.process, 1);
      WaitForSingleObject(child_.process, 1000);
    }
    child_.close_all();
    alive_ = false;
  }

 private:
  ChildPipes child_{};
  PipeLineReader reader_{};
  bool alive_ = false;
};
#else
bool set_nonblock_cloexec(int fd) {
  const int flags = fcntl(fd, F_GETFL, 0);
  if (flags < 0 || fcntl(fd, F_SETFL, flags | O_NONBLOCK) != 0) return false;
  const int fd_flags = fcntl(fd, F_GETFD, 0);
  if (fd_flags < 0 || fcntl(fd, F_SETFD, fd_flags | FD_CLOEXEC) != 0) return false;
  return true;
}

bool write_all_posix(int fd, const std::string& data,
                     std::chrono::steady_clock::time_point deadline) {
  size_t written = 0;
  while (written < data.size()) {
    const auto now = std::chrono::steady_clock::now();
    if (now >= deadline) return false;
    const int rem_ms = static_cast<int>(
        std::max<int64_t>(1, std::chrono::duration_cast<std::chrono::milliseconds>(deadline - now).count()));
    struct pollfd pfd {};
    pfd.fd = fd;
    pfd.events = POLLOUT;
    const int pr = poll(&pfd, 1, rem_ms);
    if (pr < 0) {
      if (errno == EINTR) continue;
      return false;
    }
    if (pr == 0) return false;
    if (pfd.revents & (POLLERR | POLLHUP | POLLNVAL)) return false;
    const ssize_t n = write(fd, data.data() + written, data.size() - written);
    if (n < 0) {
      if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
      return false;
    }
    if (n == 0) return false;
    written += static_cast<size_t>(n);
  }
  return true;
}

bool drain_expect_eof_posix(int fd, PipeLineReader& reader,
                            std::chrono::steady_clock::time_point deadline) {
  if (reader.has_pending()) return false;
  char tmp[256];
  while (true) {
    const auto now = std::chrono::steady_clock::now();
    if (now >= deadline) return false;
    const int rem_ms = static_cast<int>(
        std::max<int64_t>(1, std::chrono::duration_cast<std::chrono::milliseconds>(deadline - now).count()));
    struct pollfd pfd {};
    pfd.fd = fd;
    pfd.events = POLLIN;
    const int pr = poll(&pfd, 1, rem_ms);
    if (pr < 0) {
      if (errno == EINTR) continue;
      return false;
    }
    if (pr == 0) return false;
    const ssize_t r = read(fd, tmp, sizeof(tmp));
    if (r < 0) {
      if (errno == EINTR || errno == EAGAIN || errno == EWOULDBLOCK) continue;
      return false;
    }
    return r == 0;
  }
}

bool wait4_deadline(pid_t pid, int& status_out, struct rusage& ru_out,
                    std::chrono::steady_clock::time_point deadline, bool& timed_out) {
  timed_out = false;
  while (true) {
    const pid_t w = wait4(pid, &status_out, WNOHANG, &ru_out);
    if (w == pid) return true;
    if (w < 0) {
      if (errno == EINTR) continue;
      return false;
    }
    if (std::chrono::steady_clock::now() >= deadline) {
      timed_out = true;
      return false;
    }
    usleep(500);
  }
}

ResourceSample rusage_to_sample(const struct rusage& ru) {
  ResourceSample s;
  s.cpu_supported = true;
  s.cpu_ms =
      static_cast<double>(ru.ru_utime.tv_sec + ru.ru_stime.tv_sec) * 1000.0 +
      static_cast<double>(ru.ru_utime.tv_usec + ru.ru_stime.tv_usec) / 1000.0;
#if defined(__linux__)
  s.rss_supported = true;
  s.peak_rss_bytes = static_cast<uint64_t>(ru.ru_maxrss) * 1024ULL;
  s.rss_bytes = s.peak_rss_bytes;
#elif defined(__APPLE__)
  s.rss_supported = true;
  s.peak_rss_bytes = static_cast<uint64_t>(ru.ru_maxrss);
  s.rss_bytes = s.peak_rss_bytes;
#else
  s.rss_supported = false;
#endif
  return s;
}

ResourceSample sample_live_posix(pid_t pid) {
  ResourceSample s;
#if defined(__linux__)
  std::ifstream ifs("/proc/" + std::to_string(pid) + "/status");
  if (!ifs) return s;
  std::string line;
  bool got_rss = false;
  bool got_hwm = false;
  while (std::getline(ifs, line)) {
    if (line.rfind("VmRSS:", 0) == 0) {
      unsigned long long kb = 0;
      if (std::sscanf(line.c_str() + 6, "%llu", &kb) == 1) {
        s.rss_bytes = static_cast<uint64_t>(kb) * 1024ULL;
        got_rss = true;
      }
    } else if (line.rfind("VmHWM:", 0) == 0) {
      unsigned long long kb = 0;
      if (std::sscanf(line.c_str() + 6, "%llu", &kb) == 1) {
        s.peak_rss_bytes = static_cast<uint64_t>(kb) * 1024ULL;
        got_hwm = true;
      }
    }
  }
  s.rss_supported = got_rss || got_hwm;
  if (!got_hwm) s.peak_rss_bytes = s.rss_bytes;
#else
  (void)pid;
#endif
  return s;
}

bool spawn_worker_posix(const std::string& bin, const std::string& flag, int& in_write_out,
                        int& out_read_out, pid_t& pid_out) {
  int in_pipe[2] = {-1, -1};
  int out_pipe[2] = {-1, -1};
  if (pipe(in_pipe) != 0) return false;
  if (pipe(out_pipe) != 0) {
    close(in_pipe[0]);
    close(in_pipe[1]);
    return false;
  }
  const int devnull = open("/dev/null", O_WRONLY | O_CLOEXEC);

  const pid_t pid = fork();
  if (pid < 0) {
    close(in_pipe[0]);
    close(in_pipe[1]);
    close(out_pipe[0]);
    close(out_pipe[1]);
    if (devnull >= 0) close(devnull);
    return false;
  }
  if (pid == 0) {
    dup2(in_pipe[0], STDIN_FILENO);
    dup2(out_pipe[1], STDOUT_FILENO);
    if (devnull >= 0) {
      dup2(devnull, STDERR_FILENO);
      close(devnull);
    }
    close(in_pipe[0]);
    close(in_pipe[1]);
    close(out_pipe[0]);
    close(out_pipe[1]);
    if (flag.empty()) {
      char* const argv_exec[] = {const_cast<char*>(bin.c_str()), nullptr};
      execvp(bin.c_str(), argv_exec);
    } else {
      char* const argv_exec[] = {const_cast<char*>(bin.c_str()), const_cast<char*>(flag.c_str()),
                                 nullptr};
      execvp(bin.c_str(), argv_exec);
    }
    _exit(127);
  }
  if (devnull >= 0) close(devnull);
  close(in_pipe[0]);
  close(out_pipe[1]);
  if (!set_nonblock_cloexec(in_pipe[1]) || !set_nonblock_cloexec(out_pipe[0])) {
    close(in_pipe[1]);
    close(out_pipe[0]);
    kill(pid, SIGKILL);
    int st = 0;
    waitpid(pid, &st, 0);
    return false;
  }
  in_write_out = in_pipe[1];
  out_read_out = out_pipe[0];
  pid_out = pid;
  return true;
}

bool run_oneshot_request(const std::string& bin, const std::string& req, std::string& out_line,
                         double& latency_ms, ResourceSample& res, bool& timed_out_out,
                         std::string& err_out) {
  out_line.clear();
  timed_out_out = false;
  err_out.clear();
  if (req.size() > kMaxRequestBytes + 1 || req.empty() || req.back() != '\n') {
    err_out = "request exceeds 32 KiB limit or lacks newline framing";
    return false;
  }

  const auto t0 = std::chrono::steady_clock::now();
  const auto deadline = t0 + std::chrono::milliseconds(kWorkerTimeoutMs);
  int in_write = -1;
  int out_read = -1;
  pid_t pid = -1;
  if (!spawn_worker_posix(bin, "--oneshot-ndjson", in_write, out_read, pid)) {
    err_out = "spawn failed for oneshot worker";
    return false;
  }

  bool io_ok = write_all_posix(in_write, req, deadline);
  close(in_write);

  PipeLineReader reader;
  if (io_ok) io_ok = reader.read_line(out_read, kMaxOutputBytes, deadline, out_line);
  if (io_ok) io_ok = drain_expect_eof_posix(out_read, reader, deadline);
  close(out_read);

  int status = 0;
  struct rusage ru {};
  bool wait_timeout = false;
  const bool waited = io_ok && wait4_deadline(pid, status, ru, deadline, wait_timeout);
  const auto t1 = std::chrono::steady_clock::now();
  latency_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();

  if (!io_ok && std::chrono::steady_clock::now() >= deadline) wait_timeout = true;
  if (wait_timeout) {
    timed_out_out = true;
    err_out = "oneshot worker exceeded 5000ms deadline";
    kill(pid, SIGKILL);
    waitpid(pid, &status, 0);
    return false;
  }
  if (!waited || !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
    err_out = "oneshot worker I/O failure or non-zero exit";
    kill(pid, SIGKILL);
    waitpid(pid, &status, 0);
    return false;
  }
  res = rusage_to_sample(ru);
  return true;
}

class RetainedWorker {
 public:
  ~RetainedWorker() { abort_kill(); }

  bool start(const std::string& bin, double& spawn_ms, std::string& err_out) {
    const auto t0 = std::chrono::steady_clock::now();
    if (!spawn_worker_posix(bin, "--retained-ndjson", in_write_, out_read_, pid_)) {
      err_out = "spawn failed for retained worker";
      return false;
    }
    const auto t1 = std::chrono::steady_clock::now();
    spawn_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    alive_ = true;
    reader_.reset();
    return true;
  }

  bool request(const std::string& req, std::string& out_line, double& latency_ms,
               bool& timed_out_out, std::string& err_out) {
    out_line.clear();
    timed_out_out = false;
    err_out.clear();
    if (!alive_) {
      err_out = "retained worker not alive";
      return false;
    }
    if (req.size() > kMaxRequestBytes + 1 || req.empty() || req.back() != '\n') {
      err_out = "request exceeds 32 KiB limit or lacks newline framing";
      return false;
    }
    const auto t0 = std::chrono::steady_clock::now();
    const auto deadline = t0 + std::chrono::milliseconds(kWorkerTimeoutMs);
    const bool ok =
        write_all_posix(in_write_, req, deadline) &&
        reader_.read_line(out_read_, kMaxOutputBytes, deadline, out_line);
    const auto t1 = std::chrono::steady_clock::now();
    latency_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
    if (!ok) {
      if (std::chrono::steady_clock::now() >= deadline) {
        timed_out_out = true;
        err_out = "retained worker exceeded 5000ms deadline";
      } else {
        err_out = "retained worker pipe/output failure";
      }
      abort_kill();
      return false;
    }
    return true;
  }

  ResourceSample sample_live() const {
    if (!alive_ || pid_ <= 0) return ResourceSample{};
    return sample_live_posix(pid_);
  }

  bool close_gracefully(ResourceSample& final_res, bool& timed_out_out, std::string& err_out) {
    timed_out_out = false;
    err_out.clear();
    if (!alive_) return true;
    if (in_write_ >= 0) {
      close(in_write_);
      in_write_ = -1;
    }
    const auto deadline =
        std::chrono::steady_clock::now() + std::chrono::milliseconds(kWorkerTimeoutMs);
    const bool clean_eof = drain_expect_eof_posix(out_read_, reader_, deadline);
    int status = 0;
    struct rusage ru {};
    bool wait_timeout = false;
    const bool waited = clean_eof && wait4_deadline(pid_, status, ru, deadline, wait_timeout);
    if (wait_timeout || (!clean_eof && std::chrono::steady_clock::now() >= deadline)) {
      timed_out_out = true;
      err_out = "retained worker shutdown exceeded 5000ms deadline";
      abort_kill();
      return false;
    }
    if (!waited || !WIFEXITED(status) || WEXITSTATUS(status) != 0) {
      err_out = "retained worker non-zero exit or unexpected trailing output on shutdown";
      abort_kill();
      return false;
    }
    close(out_read_);
    out_read_ = -1;
    pid_ = -1;
    alive_ = false;
    final_res = rusage_to_sample(ru);
    return true;
  }

  void abort_kill() {
    if (in_write_ >= 0) {
      close(in_write_);
      in_write_ = -1;
    }
    if (out_read_ >= 0) {
      close(out_read_);
      out_read_ = -1;
    }
    if (pid_ > 0) {
      kill(pid_, SIGKILL);
      int st = 0;
      waitpid(pid_, &st, 0);
      pid_ = -1;
    }
    alive_ = false;
  }

 private:
  int in_write_ = -1;
  int out_read_ = -1;
  pid_t pid_ = -1;
  PipeLineReader reader_{};
  bool alive_ = false;
};
#endif

double quantile_linear(const std::vector<double>& sorted, double p) {
  if (sorted.empty()) return 0.0;
  if (sorted.size() == 1) return sorted[0];
  const double idx = p * static_cast<double>(sorted.size() - 1);
  const size_t lo = static_cast<size_t>(std::floor(idx));
  const size_t hi = static_cast<size_t>(std::ceil(idx));
  const double frac = idx - static_cast<double>(lo);
  return sorted[lo] * (1.0 - frac) + sorted[hi] * frac;
}

struct SummaryStats {
  double p50_ms = 0.0;
  double p95_ms = 0.0;
  double p99_ms = 0.0;
  double mean_ms = 0.0;
  double min_ms = 0.0;
  double max_ms = 0.0;
};

SummaryStats compute_stats(std::vector<double> values) {
  SummaryStats st;
  if (values.empty()) return st;
  std::sort(values.begin(), values.end());
  double sum = 0.0;
  for (double v : values) sum += v;
  st.min_ms = values.front();
  st.max_ms = values.back();
  st.mean_ms = sum / static_cast<double>(values.size());
  st.p50_ms = quantile_linear(values, 0.50);
  st.p95_ms = quantile_linear(values, 0.95);
  st.p99_ms = quantile_linear(values, 0.99);
  return st;
}

std::string query_os_version() {
#if defined(_WIN32)
  using RtlGetVersionFn = LONG(WINAPI*)(OSVERSIONINFOW*);
  HMODULE ntdll = GetModuleHandleW(L"ntdll.dll");
  if (ntdll != nullptr) {
    auto fn = reinterpret_cast<RtlGetVersionFn>(
        reinterpret_cast<void*>(GetProcAddress(ntdll, "RtlGetVersion")));
    if (fn != nullptr) {
      OSVERSIONINFOW info{};
      info.dwOSVersionInfoSize = sizeof(info);
      if (fn(&info) == 0) {
        std::ostringstream oss;
        oss << "Windows " << info.dwMajorVersion << "." << info.dwMinorVersion << " (build "
            << info.dwBuildNumber << ")";
        return oss.str();
      }
    }
  }
  return "Windows (version unavailable)";
#elif defined(COSTELLAR_POSIX_PIPES)
  struct utsname u {};
  if (uname(&u) == 0) {
    return std::string(u.sysname) + " " + u.release + " (" + u.machine + ")";
  }
  return "POSIX (uname unavailable)";
#endif
}

std::string query_cpu_model() {
#if defined(_WIN32)
#if defined(_M_X64) || defined(_M_IX86) || defined(__x86_64__) || defined(__i386__)
  int regs[4] = {0, 0, 0, 0};
  auto call_cpuid = [&](int leaf, int out[4]) {
#if defined(_MSC_VER)
    __cpuid(out, leaf);
#else
    unsigned int eax = 0, ebx = 0, ecx = 0, edx = 0;
    __get_cpuid(static_cast<unsigned int>(leaf), &eax, &ebx, &ecx, &edx);
    out[0] = static_cast<int>(eax);
    out[1] = static_cast<int>(ebx);
    out[2] = static_cast<int>(ecx);
    out[3] = static_cast<int>(edx);
#endif
  };
  call_cpuid(static_cast<int>(0x80000000u), regs);
  const unsigned int max_ext = static_cast<unsigned int>(regs[0]);
  if (max_ext >= 0x80000004u) {
    char brand[49]{};
    for (int i = 0; i < 3; ++i) {
      call_cpuid(static_cast<int>(0x80000002u + static_cast<unsigned int>(i)), regs);
      std::memcpy(brand + i * 16, regs, 16);
    }
    std::string s(brand);
    const size_t first = s.find_first_not_of(' ');
    const size_t last = s.find_last_not_of(' ');
    if (first != std::string::npos) return s.substr(first, last - first + 1);
  }
#endif
  return "unavailable";
#elif defined(__linux__)
  std::ifstream ifs("/proc/cpuinfo");
  std::string line;
  while (std::getline(ifs, line)) {
    if (line.rfind("model name", 0) == 0 || line.rfind("Hardware", 0) == 0) {
      const size_t colon = line.find(':');
      if (colon != std::string::npos) {
        std::string val = line.substr(colon + 1);
        const size_t first = val.find_first_not_of(" \t");
        if (first != std::string::npos) return val.substr(first);
      }
    }
  }
  return "unavailable";
#elif defined(__APPLE__)
  char buf[256]{};
  size_t len = sizeof(buf);
  if (sysctlbyname("machdep.cpu.brand_string", buf, &len, nullptr, 0) == 0 && len > 0) {
    return std::string(buf);
  }
  return "unavailable";
#else
  return "unavailable";
#endif
}

std::string harness_compiler_id() {
#if defined(__clang__)
  return std::string("clang ") + __clang_version__;
#elif defined(__GNUC__)
  return std::string("gcc ") + __VERSION__;
#elif defined(_MSC_VER)
  return std::string("msvc ") + std::to_string(_MSC_FULL_VER);
#else
  return "unknown";
#endif
}

std::string compute_catalog_sha256() {
  Sha256 h;
  std::ostringstream oss;
  oss.imbue(std::locale::classic());
  oss << std::setprecision(17);
  for (const auto& p : kPatterns) {
    oss << p.id << "|" << p.constellationId << "|" << p.name << "|" << p.points.size() << ":";
    for (const auto& pt : p.points) oss << pt.x << "," << pt.y << ";";
    oss << "\n";
  }
  h.update_str(oss.str());
  return h.finish_hex();
}

std::string resolve_default_bench_bin() {
  std::error_code ec;
#if defined(_WIN32)
  if (std::filesystem::exists("native/.build/recognizer_bench.exe", ec)) {
    return "native/.build/recognizer_bench.exe";
  }
  if (std::filesystem::exists("recognizer_bench.exe", ec)) return "recognizer_bench.exe";
  return "native/.build/recognizer_bench.exe";
#else
  if (std::filesystem::exists("native/.build/recognizer_bench", ec)) {
    return "native/.build/recognizer_bench";
  }
  if (std::filesystem::exists("./recognizer_bench", ec)) return "./recognizer_bench";
  return "native/.build/recognizer_bench";
#endif
}

bool parse_u64_strict(const std::string& text, int base, uint64_t& out) {
  if (text.empty() || text[0] == '-') return false;
  errno = 0;
  char* end_ptr = nullptr;
  const unsigned long long val = std::strtoull(text.c_str(), &end_ptr, base);
  if (errno == ERANGE || end_ptr == text.c_str() || *end_ptr != '\0') return false;
  out = static_cast<uint64_t>(val);
  return true;
}

struct BlockResult {
  size_t block_index = 0;
  std::string order;
  std::vector<double> oneshot_ms;
  std::vector<double> retained_ms;
  ResourceSample retained_rss{};
};

struct RawRequestSample {
  size_t block_index = 0;
  size_t req_index = 0;
  std::string category;
  size_t point_count = 0;
  size_t request_bytes = 0;
  size_t response_bytes = 0;
  double oneshot_ms = 0.0;
  double retained_ms = 0.0;
};

}  // namespace

int main(int argc, char** argv) {
#if defined(COSTELLAR_POSIX_PIPES)
  std::signal(SIGPIPE, SIG_IGN);
#endif

  std::string bin = resolve_default_bench_bin();
  std::string out_path;
  std::string worker_compiler = "unspecified";
  std::string worker_flags = "unspecified";
  std::string harness_flags = "unspecified";
  size_t warmups = kDefaultWarmups;
  size_t blocks = kDefaultBlocks;
  size_t block_size = kDefaultBlockSize;
  size_t bootstraps = kDefaultBootstraps;
  uint64_t seed = kDefaultWorkloadSeed;
  bool bin_set_positionally = false;

  for (int i = 1; i < argc; ++i) {
    const std::string arg(argv[i]);
    auto need_val = [&](const char* name) -> std::string {
      if (i + 1 >= argc) {
        std::cerr << "Missing value for " << name << "\n";
        std::exit(2);
      }
      return std::string(argv[++i]);
    };
    if (arg == "--bin") {
      bin = need_val("--bin");
    } else if (arg == "--out") {
      out_path = need_val("--out");
    } else if (arg == "--worker-compiler") {
      worker_compiler = need_val("--worker-compiler");
    } else if (arg == "--worker-flags") {
      worker_flags = need_val("--worker-flags");
    } else if (arg == "--harness-flags") {
      harness_flags = need_val("--harness-flags");
    } else if (arg == "--warmups") {
      uint64_t v = 0;
      if (!parse_u64_strict(need_val("--warmups"), 10, v)) {
        std::cerr << "Invalid integer for --warmups\n";
        return 2;
      }
      warmups = static_cast<size_t>(v);
    } else if (arg == "--blocks") {
      uint64_t v = 0;
      if (!parse_u64_strict(need_val("--blocks"), 10, v)) {
        std::cerr << "Invalid integer for --blocks\n";
        return 2;
      }
      blocks = static_cast<size_t>(v);
    } else if (arg == "--block-size") {
      uint64_t v = 0;
      if (!parse_u64_strict(need_val("--block-size"), 10, v)) {
        std::cerr << "Invalid integer for --block-size\n";
        return 2;
      }
      block_size = static_cast<size_t>(v);
    } else if (arg == "--bootstraps") {
      uint64_t v = 0;
      if (!parse_u64_strict(need_val("--bootstraps"), 10, v)) {
        std::cerr << "Invalid integer for --bootstraps\n";
        return 2;
      }
      bootstraps = static_cast<size_t>(v);
    } else if (arg == "--seed") {
      if (!parse_u64_strict(need_val("--seed"), 0, seed)) {
        std::cerr << "Invalid integer for --seed\n";
        return 2;
      }
    } else if (!arg.empty() && arg[0] != '-' && !bin_set_positionally) {
      bin = arg;
      bin_set_positionally = true;
    } else {
      std::cerr << "Unknown or duplicate argument: " << arg << "\n";
      return 2;
    }
  }

  if (blocks == 0 || block_size == 0 || bootstraps < 100) {
    std::cerr << "Invalid benchmark protocol dimensions\n";
    return 2;
  }

  std::string worker_sha256;
  if (!sha256_file(bin, worker_sha256)) {
    std::cerr << "Cannot read worker binary: " << bin << "\n";
    return 1;
  }
  const std::string catalog_sha256 = compute_catalog_sha256();

  // Build deterministic cold, warmup, and paired AB/BA block workloads.
  std::vector<const Pattern*> all_pats;
  for (const auto& p : kPatterns) all_pats.push_back(&p);
  SplitMix64 cold_rng(seed ^ 0x1111ULL);
  const WorkloadItem cold_item = make_matched_item(all_pats, cold_rng, "cold_probe");

  std::vector<WorkloadItem> warmup_items = build_block_workload(seed ^ 0x2222ULL, warmups);
  std::vector<std::vector<WorkloadItem>> block_items(blocks);
  for (size_t b = 0; b < blocks; ++b) {
    block_items[b] =
        build_block_workload(seed ^ (0x10000ULL + static_cast<uint64_t>(b) * 0x9E37ULL), block_size);
  }

  Sha256 seq_hash;
  seq_hash.update_str("cold:" + cold_item.ndjson_line);
  for (const auto& w : warmup_items) seq_hash.update_str("warm:" + w.ndjson_line);
  for (size_t b = 0; b < blocks; ++b) {
    for (const auto& r : block_items[b]) seq_hash.update_str("b" + std::to_string(b) + ":" + r.ndjson_line);
  }
  const std::string request_sequence_sha256 = seq_hash.finish_hex();

  bool tainted = false;
  std::string abort_reason;
  size_t oneshot_failures = 0;
  size_t oneshot_timeouts = 0;
  size_t retained_failures = 0;
  size_t retained_timeouts = 0;
  size_t parity_mismatches = 0;
  size_t max_response_bytes = 0;

  // Cold-start measurements kept strictly separate from warmups and paired blocks.
  double cold_oneshot_ms = 0.0;
  ResourceSample cold_oneshot_res{};
  std::string cold_oneshot_out;
  bool cold_to = false;
  std::string cold_err;
  if (!run_oneshot_request(bin, cold_item.ndjson_line, cold_oneshot_out, cold_oneshot_ms,
                           cold_oneshot_res, cold_to, cold_err) ||
      !valid_worker_response_json(cold_oneshot_out)) {
    tainted = true;
    ++oneshot_failures;
    if (cold_to) ++oneshot_timeouts;
    abort_reason = "cold oneshot failed: " + cold_err;
  }

  double cold_ret_spawn_ms = 0.0;
  double cold_ret_first_ms = 0.0;
  ResourceSample cold_ret_res{};
  if (!tainted) {
    RetainedWorker cold_worker;
    std::string cold_ret_out;
    if (!cold_worker.start(bin, cold_ret_spawn_ms, cold_err)) {
      tainted = true;
      ++retained_failures;
      abort_reason = "cold retained spawn failed: " + cold_err;
    } else if (!cold_worker.request(cold_item.ndjson_line, cold_ret_out, cold_ret_first_ms,
                                    cold_to, cold_err) ||
               !valid_worker_response_json(cold_ret_out)) {
      tainted = true;
      ++retained_failures;
      if (cold_to) ++retained_timeouts;
      abort_reason = "cold retained first request failed: " + cold_err;
    } else if (cold_ret_out != cold_oneshot_out) {
      tainted = true;
      ++parity_mismatches;
      abort_reason = "cold parity mismatch between oneshot and retained";
    } else {
      max_response_bytes = std::max(max_response_bytes, cold_oneshot_out.size());
      if (!cold_worker.close_gracefully(cold_ret_res, cold_to, cold_err)) {
        tainted = true;
        ++retained_failures;
        if (cold_to) ++retained_timeouts;
        abort_reason = "cold retained close failed: " + cold_err;
      }
    }
  }

  // Main benchmark retained worker (1 process across warmups + all 20x50 paired blocks; no auto-restart).
  RetainedWorker main_retained;
  double main_ret_spawn_ms = 0.0;
  if (!tainted && !main_retained.start(bin, main_ret_spawn_ms, cold_err)) {
    tainted = true;
    ++retained_failures;
    abort_reason = "main retained spawn failed: " + cold_err;
  }

  // Warm-up requests (excluded from timed statistics).
  double oneshot_cpu_total_ms = 0.0;
  bool oneshot_cpu_supported = true;
  uint64_t oneshot_peak_rss_bytes = 0;
  bool oneshot_rss_supported = true;

  if (!tainted) {
    for (size_t w = 0; w < warmup_items.size(); ++w) {
      std::string out_one;
      std::string out_ret;
      double lat_one = 0.0;
      double lat_ret = 0.0;
      ResourceSample res_one{};
      bool to_one = false;
      bool to_ret = false;
      std::string err_one;
      std::string err_ret;
      if (!run_oneshot_request(bin, warmup_items[w].ndjson_line, out_one, lat_one, res_one, to_one,
                               err_one) ||
          !valid_worker_response_json(out_one)) {
        tainted = true;
        ++oneshot_failures;
        if (to_one) ++oneshot_timeouts;
        abort_reason = "warmup #" + std::to_string(w) + " oneshot failed: " + err_one;
        break;
      }
      if (!main_retained.request(warmup_items[w].ndjson_line, out_ret, lat_ret, to_ret, err_ret) ||
          !valid_worker_response_json(out_ret)) {
        tainted = true;
        ++retained_failures;
        if (to_ret) ++retained_timeouts;
        abort_reason = "warmup #" + std::to_string(w) + " retained failed: " + err_ret;
        break;
      }
      if (out_one != out_ret) {
        tainted = true;
        ++parity_mismatches;
        abort_reason = "warmup #" + std::to_string(w) + " parity mismatch";
        break;
      }
      max_response_bytes = std::max(max_response_bytes, out_one.size());
    }
  }

  ResourceSample retained_after_warmups{};
  if (!tainted) {
    retained_after_warmups = main_retained.sample_live();
  }

  // 20 paired AB/BA blocks x 50 requests.
  std::vector<BlockResult> block_results;
  std::vector<RawRequestSample> raw_samples;
  std::vector<double> all_oneshot_ms;
  std::vector<double> all_retained_ms;
  block_results.reserve(blocks);
  raw_samples.reserve(blocks * block_size);
  all_oneshot_ms.reserve(blocks * block_size);
  all_retained_ms.reserve(blocks * block_size);

  if (!tainted) {
    for (size_t b = 0; b < blocks && !tainted; ++b) {
      const bool ab_order = (b % 2 == 0);
      BlockResult br;
      br.block_index = b;
      br.order = ab_order ? "AB" : "BA";
      br.oneshot_ms.assign(block_size, 0.0);
      br.retained_ms.assign(block_size, 0.0);
      std::vector<std::string> outs_one(block_size);
      std::vector<std::string> outs_ret(block_size);

      auto run_arm_one = [&]() -> bool {
        for (size_t i = 0; i < block_size; ++i) {
          ResourceSample r{};
          bool to = false;
          std::string err;
          if (!run_oneshot_request(bin, block_items[b][i].ndjson_line, outs_one[i],
                                   br.oneshot_ms[i], r, to, err) ||
              !valid_worker_response_json(outs_one[i])) {
            tainted = true;
            ++oneshot_failures;
            if (to) ++oneshot_timeouts;
            abort_reason =
                "block " + std::to_string(b) + " req " + std::to_string(i) + " oneshot: " + err;
            return false;
          }
          if (r.cpu_supported) {
            oneshot_cpu_total_ms += r.cpu_ms;
          } else {
            oneshot_cpu_supported = false;
          }
          if (r.rss_supported) {
            oneshot_peak_rss_bytes = std::max(oneshot_peak_rss_bytes, r.peak_rss_bytes);
          } else {
            oneshot_rss_supported = false;
          }
        }
        return true;
      };

      auto run_arm_ret = [&]() -> bool {
        for (size_t i = 0; i < block_size; ++i) {
          bool to = false;
          std::string err;
          if (!main_retained.request(block_items[b][i].ndjson_line, outs_ret[i],
                                     br.retained_ms[i], to, err) ||
              !valid_worker_response_json(outs_ret[i])) {
            tainted = true;
            ++retained_failures;
            if (to) ++retained_timeouts;
            abort_reason =
                "block " + std::to_string(b) + " req " + std::to_string(i) + " retained: " + err;
            return false;
          }
        }
        return true;
      };

      if (ab_order) {
        if (!run_arm_one() || !run_arm_ret()) break;
      } else {
        if (!run_arm_ret() || !run_arm_one()) break;
      }

      for (size_t i = 0; i < block_size; ++i) {
        if (outs_one[i] != outs_ret[i]) {
          tainted = true;
          ++parity_mismatches;
          abort_reason =
              "parity mismatch at block " + std::to_string(b) + " req " + std::to_string(i);
          break;
        }
        max_response_bytes = std::max(max_response_bytes, outs_one[i].size());
        all_oneshot_ms.push_back(br.oneshot_ms[i]);
        all_retained_ms.push_back(br.retained_ms[i]);
        raw_samples.push_back({b, i, block_items[b][i].category, block_items[b][i].point_count,
                               block_items[b][i].ndjson_line.size(), outs_one[i].size(),
                               br.oneshot_ms[i], br.retained_ms[i]});
      }
      if (tainted) break;
      br.retained_rss = main_retained.sample_live();
      block_results.push_back(std::move(br));
    }
  }

  ResourceSample retained_final_res{};
  bool shut_to = false;
  std::string shut_err;
  if (!tainted) {
    if (!main_retained.close_gracefully(retained_final_res, shut_to, shut_err)) {
      tainted = true;
      ++retained_failures;
      if (shut_to) ++retained_timeouts;
      abort_reason = "main retained close failed: " + shut_err;
    }
  } else {
    main_retained.abort_kill();
  }

  SummaryStats one_stats{};
  SummaryStats ret_stats{};
  double p95_abs_diff = 0.0;
  double p95_rel_pct = 0.0;
  double p50_abs_diff = 0.0;
  double p50_rel_pct = 0.0;
  double ci95_ms_lo = 0.0;
  double ci95_ms_hi = 0.0;
  double ci95_pct_lo = 0.0;
  double ci95_pct_hi = 0.0;

  if (!tainted && block_results.size() == blocks) {
    one_stats = compute_stats(all_oneshot_ms);
    ret_stats = compute_stats(all_retained_ms);
    p95_abs_diff = one_stats.p95_ms - ret_stats.p95_ms;
    p95_rel_pct = one_stats.p95_ms > 0.0 ? (100.0 * p95_abs_diff / one_stats.p95_ms) : 0.0;
    p50_abs_diff = one_stats.p50_ms - ret_stats.p50_ms;
    p50_rel_pct = one_stats.p50_ms > 0.0 ? (100.0 * p50_abs_diff / one_stats.p50_ms) : 0.0;

    // Fixed-seed paired-block bootstrap 95% confidence interval for p95 improvement.
    SplitMix64 boot_rng(kDefaultBootstrapSeed);
    std::vector<double> boot_diff_ms;
    std::vector<double> boot_diff_pct;
    boot_diff_ms.reserve(bootstraps);
    boot_diff_pct.reserve(bootstraps);
    std::vector<double> sample_one;
    std::vector<double> sample_ret;
    sample_one.reserve(blocks * block_size);
    sample_ret.reserve(blocks * block_size);

    for (size_t r = 0; r < bootstraps; ++r) {
      sample_one.clear();
      sample_ret.clear();
      for (size_t k = 0; k < blocks; ++k) {
        const size_t idx = boot_rng.next_index(blocks);
        const auto& br = block_results[idx];
        sample_one.insert(sample_one.end(), br.oneshot_ms.begin(), br.oneshot_ms.end());
        sample_ret.insert(sample_ret.end(), br.retained_ms.begin(), br.retained_ms.end());
      }
      std::sort(sample_one.begin(), sample_one.end());
      std::sort(sample_ret.begin(), sample_ret.end());
      const double p95_o = quantile_linear(sample_one, 0.95);
      const double p95_r = quantile_linear(sample_ret, 0.95);
      const double d_ms = p95_o - p95_r;
      const double d_pct = p95_o > 0.0 ? (100.0 * d_ms / p95_o) : 0.0;
      boot_diff_ms.push_back(d_ms);
      boot_diff_pct.push_back(d_pct);
    }
    std::sort(boot_diff_ms.begin(), boot_diff_ms.end());
    std::sort(boot_diff_pct.begin(), boot_diff_pct.end());
    ci95_ms_lo = quantile_linear(boot_diff_ms, 0.025);
    ci95_ms_hi = quantile_linear(boot_diff_ms, 0.975);
    ci95_pct_lo = quantile_linear(boot_diff_pct, 0.025);
    ci95_pct_hi = quantile_linear(boot_diff_pct, 0.975);
  }

  bool live_rss_supported = !block_results.empty();
  uint64_t live_rss_first = 0;
  uint64_t live_rss_last = 0;
  bool monotonic_rss_growth = false;
  if (live_rss_supported) {
    for (const auto& br : block_results) {
      if (!br.retained_rss.rss_supported) {
        live_rss_supported = false;
        break;
      }
    }
    if (live_rss_supported) {
      live_rss_first = block_results.front().retained_rss.rss_bytes;
      live_rss_last = block_results.back().retained_rss.rss_bytes;
      monotonic_rss_growth = block_results.size() > 1;
      for (size_t i = 1; i < block_results.size(); ++i) {
        if (block_results[i].retained_rss.rss_bytes <=
            block_results[i - 1].retained_rss.rss_bytes) {
          monotonic_rss_growth = false;
          break;
        }
      }
    }
  }

  std::ostringstream json;
  json.imbue(std::locale::classic());
  json << std::fixed << std::setprecision(6);
  json << "{\n";
  json << "  \"schemaVersion\": 1,\n";
  json << "  \"prototypeScope\": \"offline-native-c++17-prototype\",\n";
  json << "  \"productE2eClaim\": false,\n";
  json << "  \"legacyHttpDenominatorSeparate\": true,\n";
  json << "  \"tainted\": " << (tainted ? "true" : "false") << ",\n";
  json << "  \"abortReason\": \"" << json_escape(abort_reason) << "\",\n";
  json << "  \"provenance\": {\n";
  json << "    \"os\": \"" << json_escape(query_os_version()) << "\",\n";
  json << "    \"cpuModel\": \"" << json_escape(query_cpu_model()) << "\",\n";
  json << "    \"harnessCompiler\": \"" << json_escape(harness_compiler_id()) << "\",\n";
#if defined(_MSVC_LANG)
  json << "    \"harnessCplusplus\": " << _MSVC_LANG << ",\n";
#else
  json << "    \"harnessCplusplus\": " << __cplusplus << ",\n";
#endif
  json << "    \"harnessFastMath\": false,\n";
  json << "    \"harnessFlags\": \"" << json_escape(harness_flags) << "\",\n";
  json << "    \"workerPath\": \"" << json_escape(bin) << "\",\n";
  json << "    \"workerSha256\": \"" << worker_sha256 << "\",\n";
  json << "    \"workerCompiler\": \"" << json_escape(worker_compiler) << "\",\n";
  json << "    \"workerFlags\": \"" << json_escape(worker_flags) << "\",\n";
  json << "    \"catalogSha256\": \"" << catalog_sha256 << "\",\n";
  json << "    \"requestSequenceSha256\": \"" << request_sequence_sha256 << "\"\n";
  json << "  },\n";
  json << "  \"protocol\": {\n";
  json << "    \"warmups\": " << warmups << ",\n";
  json << "    \"blocks\": " << blocks << ",\n";
  json << "    \"blockSize\": " << block_size << ",\n";
  json << "    \"abBaInterleaved\": true,\n";
  json << "    \"workloadSeed\": " << seed << ",\n";
  json << "    \"bootstrapResamples\": " << bootstraps << ",\n";
  json << "    \"bootstrapSeed\": " << kDefaultBootstrapSeed << ",\n";
  json << "    \"requestLimitBytes\": " << kMaxRequestBytes << ",\n";
  json << "    \"outputLimitBytes\": " << kMaxOutputBytes << ",\n";
  json << "    \"timeoutMs\": " << kWorkerTimeoutMs << "\n";
  json << "  },\n";
  json << "  \"coldStart\": {\n";
  json << "    \"oneshotMs\": " << cold_oneshot_ms << ",\n";
  json << "    \"retainedSpawnMs\": " << cold_ret_spawn_ms << ",\n";
  json << "    \"retainedFirstRequestMs\": " << cold_ret_first_ms << ",\n";
  json << "    \"retainedTotalMs\": " << (cold_ret_spawn_ms + cold_ret_first_ms) << ",\n";
  json << "    \"oneshotPeakRssSupported\": " << (cold_oneshot_res.rss_supported ? "true" : "false") << ",\n";
  json << "    \"oneshotPeakRssBytes\": " << (cold_oneshot_res.rss_supported ? std::to_string(cold_oneshot_res.peak_rss_bytes) : "\"unavailable\"") << ",\n";
  json << "    \"oneshotCpuSupported\": " << (cold_oneshot_res.cpu_supported ? "true" : "false") << ",\n";
  json << "    \"oneshotCpuMs\": " << (cold_oneshot_res.cpu_supported ? std::to_string(cold_oneshot_res.cpu_ms) : "\"unavailable\"") << ",\n";
  json << "    \"retainedPeakRssSupported\": " << (cold_ret_res.rss_supported ? "true" : "false") << ",\n";
  json << "    \"retainedPeakRssBytes\": " << (cold_ret_res.rss_supported ? std::to_string(cold_ret_res.peak_rss_bytes) : "\"unavailable\"") << ",\n";
  json << "    \"retainedCpuSupported\": " << (cold_ret_res.cpu_supported ? "true" : "false") << ",\n";
  json << "    \"retainedCpuMs\": " << (cold_ret_res.cpu_supported ? std::to_string(cold_ret_res.cpu_ms) : "\"unavailable\"") << "\n";
  json << "  },\n";
  json << "  \"summary\": {\n";
  json << "    \"oneshot\": {\n";
  json << "      \"p50Ms\": " << one_stats.p50_ms << ", \"p95Ms\": " << one_stats.p95_ms
       << ", \"p99Ms\": " << one_stats.p99_ms << ", \"meanMs\": " << one_stats.mean_ms
       << ", \"minMs\": " << one_stats.min_ms << ", \"maxMs\": " << one_stats.max_ms << ",\n";
  json << "      \"cpuTimeSupported\": " << (oneshot_cpu_supported ? "true" : "false") << ",\n";
  json << "      \"cpuTotalMs\": " << (oneshot_cpu_supported ? std::to_string(oneshot_cpu_total_ms) : "\"unavailable\"") << ",\n";
  json << "      \"cpuTotalScope\": \"blocks_only\",\n";
  json << "      \"peakRssSupported\": " << (oneshot_rss_supported ? "true" : "false") << ",\n";
  json << "      \"peakRssBytes\": " << (oneshot_rss_supported ? std::to_string(oneshot_peak_rss_bytes) : "\"unavailable\"") << ",\n";
  json << "      \"failures\": " << oneshot_failures << ", \"timeouts\": " << oneshot_timeouts << "\n";
  json << "    },\n";
  json << "    \"retained\": {\n";
  json << "      \"p50Ms\": " << ret_stats.p50_ms << ", \"p95Ms\": " << ret_stats.p95_ms
       << ", \"p99Ms\": " << ret_stats.p99_ms << ", \"meanMs\": " << ret_stats.mean_ms
       << ", \"minMs\": " << ret_stats.min_ms << ", \"maxMs\": " << ret_stats.max_ms << ",\n";
  const bool retained_blocks_cpu_supported =
      retained_final_res.cpu_supported && retained_after_warmups.cpu_supported;
  const double retained_blocks_cpu_ms =
      retained_blocks_cpu_supported ? (retained_final_res.cpu_ms - retained_after_warmups.cpu_ms)
                                    : 0.0;
  json << "      \"cpuTimeSupported\": " << (retained_final_res.cpu_supported ? "true" : "false") << ",\n";
  json << "      \"cpuTotalMs\": " << (retained_final_res.cpu_supported ? std::to_string(retained_final_res.cpu_ms) : "\"unavailable\"") << ",\n";
  json << "      \"cpuTotalScope\": \"warmups_plus_blocks\",\n";
  json << "      \"cpuBlocksOnlySupported\": " << (retained_blocks_cpu_supported ? "true" : "false") << ",\n";
  json << "      \"cpuBlocksOnlyMs\": " << (retained_blocks_cpu_supported ? std::to_string(retained_blocks_cpu_ms) : "\"unavailable\"") << ",\n";
  json << "      \"peakRssSupported\": " << (retained_final_res.rss_supported ? "true" : "false") << ",\n";
  json << "      \"peakRssBytes\": " << (retained_final_res.rss_supported ? std::to_string(retained_final_res.peak_rss_bytes) : "\"unavailable\"") << ",\n";
  json << "      \"liveRssGrowthSupported\": " << (live_rss_supported ? "true" : "false") << ",\n";
  json << "      \"liveRssFirstBlockBytes\": " << (live_rss_supported ? std::to_string(live_rss_first) : "\"unavailable\"") << ",\n";
  json << "      \"liveRssLastBlockBytes\": " << (live_rss_supported ? std::to_string(live_rss_last) : "\"unavailable\"") << ",\n";
  json << "      \"monotonicRssGrowth\": " << (live_rss_supported ? (monotonic_rss_growth ? "true" : "false") : "\"unavailable\"") << ",\n";
  json << "      \"failures\": " << retained_failures << ", \"timeouts\": " << retained_timeouts << "\n";
  json << "    },\n";
  json << "    \"comparison\": {\n";
  json << "      \"p95AbsReductionMs\": " << p95_abs_diff << ",\n";
  json << "      \"p95RelReductionPct\": " << p95_rel_pct << ",\n";
  json << "      \"p50AbsReductionMs\": " << p50_abs_diff << ",\n";
  json << "      \"p50RelReductionPct\": " << p50_rel_pct << ",\n";
  json << "      \"pairedBlockBootstrap95CiMs\": [" << ci95_ms_lo << ", " << ci95_ms_hi << "],\n";
  json << "      \"pairedBlockBootstrap95CiPct\": [" << ci95_pct_lo << ", " << ci95_pct_hi << "],\n";
  json << "      \"parityMismatches\": " << parity_mismatches << ",\n";
  json << "      \"maxResponseBytes\": " << max_response_bytes << "\n";
  json << "    }\n";
  json << "  },\n";
  json << "  \"blocks\": [\n";
  for (size_t i = 0; i < block_results.size(); ++i) {
    const auto& br = block_results[i];
    const auto bs_one = compute_stats(br.oneshot_ms);
    const auto bs_ret = compute_stats(br.retained_ms);
    json << "    {\"blockIndex\": " << br.block_index << ", \"order\": \"" << br.order
         << "\", \"oneshotP50Ms\": " << bs_one.p50_ms << ", \"oneshotP95Ms\": " << bs_one.p95_ms
         << ", \"retainedP50Ms\": " << bs_ret.p50_ms << ", \"retainedP95Ms\": " << bs_ret.p95_ms
         << ", \"p95DiffMs\": " << (bs_one.p95_ms - bs_ret.p95_ms)
         << ", \"retainedLiveRssSupported\": " << (br.retained_rss.rss_supported ? "true" : "false")
         << ", \"retainedLiveRssBytes\": "
         << (br.retained_rss.rss_supported ? std::to_string(br.retained_rss.rss_bytes) : "\"unavailable\"")
         << "}" << (i + 1 < block_results.size() ? "," : "") << "\n";
  }
  json << "  ],\n";
  json << "  \"rawRequests\": [\n";
  for (size_t i = 0; i < raw_samples.size(); ++i) {
    const auto& r = raw_samples[i];
    json << "    {\"block\": " << r.block_index << ", \"idx\": " << r.req_index
         << ", \"category\": \"" << json_escape(r.category)
         << "\", \"points\": " << r.point_count << ", \"reqBytes\": " << r.request_bytes
         << ", \"respBytes\": " << r.response_bytes << ", \"oneshotMs\": " << r.oneshot_ms
         << ", \"retainedMs\": " << r.retained_ms << "}"
         << (i + 1 < raw_samples.size() ? "," : "") << "\n";
  }
  json << "  ]\n";
  json << "}\n";

  if (!out_path.empty()) {
    std::ofstream ofs(out_path, std::ios::binary | std::ios::trunc);
    if (!ofs) {
      std::cerr << "Failed to write manifest to " << out_path << "\n";
      return 1;
    }
    ofs << json.str();
    std::cout << "Wrote benchmark manifest to " << out_path << " (tainted="
              << (tainted ? "true" : "false") << ")\n";
  } else {
    std::cout << json.str();
  }
  return tainted ? 1 : 0;
}
