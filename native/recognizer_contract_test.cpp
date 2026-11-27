#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <filesystem>
#include <iomanip>
#include <iostream>
#include <limits>
#include <locale>
#include <mutex>
#include <set>
#include <sstream>
#include <string>
#include <thread>
#include <utility>
#include <vector>
#include "catalog.generated.hpp"
#include "recognizer_score_rules.hpp"

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
#elif defined(__unix__) || defined(__APPLE__)
#include <cerrno>
#include <csignal>
#include <fcntl.h>
#include <poll.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>
#define COSTELLAR_POSIX_PIPES 1
#else
#error "Unsupported platform for native subprocess/pipe contract tests"
#endif

namespace {

constexpr size_t kExpectedPatternCount = 24;
constexpr size_t kExpectedConstellationCount = 12;
constexpr size_t kMaxRequestBytes = 32768;
constexpr size_t kMaxOutputBytes = 1048576;
constexpr int kWorkerTimeoutMs = 5000;
constexpr const char* kExpectedNoMatch = "{\"status\":\"NO_MATCH\",\"candidates\":[],\"bestMatch\":null}\n";

struct ParsedCandidate {
  std::string patternId;
  std::string constellationId;
  std::string patternName;
  double residual = -1.0;
  bool isVerified = false;
  double rotationDeg = 0.0;
  double scale = 0.0;
};

struct ParsedResponse {
  std::string status;
  std::vector<ParsedCandidate> candidates;
  bool hasBestMatch = false;
  ParsedCandidate bestMatch;
};

bool extract_string_field(const std::string& obj, const std::string& key, std::string& out) {
  const std::string needle = "\"" + key + "\":\"";
  size_t search_from = 0;
  size_t pos = std::string::npos;
  while (true) {
    pos = obj.find(needle, search_from);
    if (pos == std::string::npos) return false;
    if (pos == 0 || obj[pos - 1] == '{' || obj[pos - 1] == ',') break;
    search_from = pos + 1;
  }
  size_t cur = pos + needle.size();
  out.clear();
  while (cur < obj.size()) {
    const char c = obj[cur++];
    if (c == '"') return true;
    if (c == '\\') {
      if (cur >= obj.size()) return false;
      out.push_back(obj[cur++]);
    } else {
      out.push_back(c);
    }
  }
  return false;
}

bool extract_number_field(const std::string& obj, const std::string& key, double& out) {
  const std::string needle = "\"" + key + "\":";
  size_t search_from = 0;
  size_t pos = std::string::npos;
  while (true) {
    pos = obj.find(needle, search_from);
    if (pos == std::string::npos) return false;
    if (pos == 0 || obj[pos - 1] == '{' || obj[pos - 1] == ',') break;
    search_from = pos + 1;
  }
  const size_t start = pos + needle.size();
  if (start >= obj.size()) return false;
  char* end_ptr = nullptr;
  out = std::strtod(obj.c_str() + start, &end_ptr);
  if (end_ptr == obj.c_str() + start || !std::isfinite(out)) return false;
  return *end_ptr == ',' || *end_ptr == '}';
}

bool parse_candidate_object(const std::string& obj, ParsedCandidate& out) {
  if (!extract_string_field(obj, "patternId", out.patternId)) return false;
  if (!extract_string_field(obj, "constellationId", out.constellationId)) return false;
  if (!extract_string_field(obj, "patternName", out.patternName)) return false;
  if (!extract_number_field(obj, "residual", out.residual) || out.residual < 0.0) return false;
  if (obj.find("\"isVerified\":true") == std::string::npos) return false;
  out.isVerified = true;
  if (!extract_number_field(obj, "rotationDeg", out.rotationDeg)) return false;
  if (!extract_number_field(obj, "scale", out.scale) || out.scale <= 0.0) return false;
  return true;
}

bool parse_response_line(const std::string& line, ParsedResponse& out) {
  out = ParsedResponse{};
  if (line.empty() || line.size() > kMaxOutputBytes || line.back() != '\n') return false;
  if (!extract_string_field(line, "status", out.status)) return false;
  if (out.status != "FULL_MATCH" && out.status != "AMBIGUOUS" && out.status != "NO_MATCH") {
    return false;
  }

  const size_t cand_key = line.find("\"candidates\":[");
  const size_t best_key = line.find("],\"bestMatch\":");
  if (cand_key == std::string::npos || best_key == std::string::npos || best_key < cand_key) {
    return false;
  }

  const size_t arr_start = cand_key + std::string("\"candidates\":[").size();
  const std::string arr_body = line.substr(arr_start, best_key - arr_start);
  if (!arr_body.empty()) {
    size_t cursor = 0;
    while (cursor < arr_body.size()) {
      if (out.candidates.size() >= 128) return false;
      if (arr_body[cursor] != '{') return false;
      const size_t close = arr_body.find('}', cursor);
      if (close == std::string::npos) return false;
      ParsedCandidate c;
      if (!parse_candidate_object(arr_body.substr(cursor, close - cursor + 1), c)) return false;
      out.candidates.push_back(c);
      cursor = close + 1;
      if (cursor < arr_body.size()) {
        if (arr_body[cursor] != ',') return false;
        ++cursor;
        if (cursor >= arr_body.size()) return false;
      }
    }
  }

  const size_t best_start = best_key + std::string("],\"bestMatch\":").size();
  if (line.size() < 2 || line[line.size() - 2] != '}') return false;
  const std::string best_body = line.substr(best_start, line.size() - 2 - best_start);
  if (best_body == "null") {
    out.hasBestMatch = false;
  } else {
    if (best_body.size() < 2 || best_body.front() != '{' || best_body.back() != '}') return false;
    if (!parse_candidate_object(best_body, out.bestMatch)) return false;
    out.hasBestMatch = true;
  }

  if (out.status == "NO_MATCH") {
    return out.candidates.empty() && !out.hasBestMatch;
  }
  return !out.candidates.empty() && out.hasBestMatch;
}

std::string to_ndjson(const std::vector<Point>& pts, bool include_unknown_fields = false) {
  std::ostringstream oss;
  oss.imbue(std::locale::classic());
  oss << std::setprecision(15) << "{";
  if (include_unknown_fields) {
    oss << "\"requestId\":\"contract-test\",\"meta\":{\"ignored\":true,\"nested\":[1,2,3]},";
  }
  oss << "\"points\":[";
  for (size_t i = 0; i < pts.size(); ++i) {
    if (i) oss << ",";
    oss << "{\"x\":" << pts[i].x << ",\"y\":" << pts[i].y;
    if (include_unknown_fields) oss << ",\"t\":" << (i * 16);
    oss << "}";
  }
  oss << "]}\n";
  return oss.str();
}

std::string to_legacy_text(const std::vector<Point>& pts) {
  std::ostringstream oss;
  oss.imbue(std::locale::classic());
  oss << std::setprecision(15) << pts.size() << "\n";
  for (const auto& p : pts) {
    oss << p.x << " " << p.y << "\n";
  }
  return oss.str();
}

std::vector<Point> apply_similarity_transform(const std::vector<Point>& pts, double scale,
                                              double deg, double tx, double ty) {
  const double rad = deg * 3.14159265358979323846 / 180.0;
  const double c = std::cos(rad);
  const double s = std::sin(rad);
  std::vector<Point> out;
  out.reserve(pts.size());
  for (const auto& p : pts) {
    out.push_back({scale * (c * p.x - s * p.y) + tx, scale * (s * p.x + c * p.y) + ty});
  }
  return out;
}

std::vector<Point> perturbed_verify_copy(const std::vector<Point>& pts, double angle_rad,
                                         double scale, double tx, double ty,
                                         double noise_fraction) {
  double sum_sq = 0.0;
  for (const auto& p : pts) sum_sq += p.x * p.x + p.y * p.y;
  const double radius = std::sqrt(sum_sq / static_cast<double>(pts.size()));
  const double noise = radius * noise_fraction;
  const double c = std::cos(angle_rad);
  const double s = std::sin(angle_rad);
  uint32_t seed = 0xC057E11u;
  auto next_rng = [&]() -> double {
    seed = static_cast<uint32_t>(seed * 1664525u + 1013904223u);
    return static_cast<double>(seed) / 4294967296.0 * 2.0 - 1.0;
  };
  std::vector<Point> out;
  out.reserve(pts.size());
  for (const auto& p : pts) {
    out.push_back({scale * (p.x * c - p.y * s) + tx + noise * next_rng(),
                   scale * (p.x * s + p.y * c) + ty + noise * next_rng()});
  }
  return out;
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

#if defined(_WIN32)
std::wstring utf8_to_wide(const std::string& s) {
  if (s.empty()) return std::wstring();
  const int len = MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), nullptr, 0);
  if (len <= 0) return std::wstring(s.begin(), s.end());
  std::wstring out(static_cast<size_t>(len), L'\0');
  MultiByteToWideChar(CP_UTF8, 0, s.data(), static_cast<int>(s.size()), &out[0], len);
  return out;
}

std::wstring quote_win_arg(const std::wstring& arg) {
  if (!arg.empty() && arg.find_first_of(L" \t\n\v\"") == std::wstring::npos) {
    return arg;
  }
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

  void close_pipes_and_handles() {
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

bool spawn_worker_win(const std::string& bin, const std::vector<std::string>& args,
                      ChildPipes& child) {
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
  if (!InitializeProcThreadAttributeList(attr_list, 1, 0, &attr_size)) {
    CloseHandle(in_read);
    CloseHandle(in_write);
    CloseHandle(out_read);
    CloseHandle(out_write);
    if (err_write != INVALID_HANDLE_VALUE) CloseHandle(err_write);
    return false;
  }
  if (!UpdateProcThreadAttribute(attr_list, 0, PROC_THREAD_ATTRIBUTE_HANDLE_LIST,
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
  for (const auto& a : args) {
    cmd.push_back(L' ');
    cmd += quote_win_arg(utf8_to_wide(a));
  }
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
  if (ReadFile(fd, tmp, sizeof(tmp), &got, nullptr)) {
    return got == 0;
  }
  return GetLastError() == ERROR_BROKEN_PIPE;
}

bool run_invocation_raw(const std::string& bin, const std::vector<std::string>& args,
                        const std::string& stdin_bytes, std::string& stdout_bytes,
                        int& exit_code_out) {
  stdout_bytes.clear();
  exit_code_out = -1;
  ChildPipes child;
  if (!spawn_worker_win(bin, args, child)) return false;

  auto& wd = get_watchdog();
  wd.begin_op(child.process, kWorkerTimeoutMs);

  bool io_ok = write_all_win(child.in_write, stdin_bytes);
  CloseHandle(child.in_write);
  child.in_write = INVALID_HANDLE_VALUE;

  PipeLineReader reader;
  if (io_ok) io_ok = reader.read_line(child.out_read, kMaxOutputBytes, stdout_bytes);
  if (io_ok) io_ok = drain_expect_eof_win(child.out_read, reader);

  DWORD exit_code = 1;
  const DWORD wait_rc = WaitForSingleObject(child.process, kWorkerTimeoutMs);
  const bool timed_out = wd.end_op();
  if (!io_ok || timed_out || wait_rc != WAIT_OBJECT_0 ||
      !GetExitCodeProcess(child.process, &exit_code)) {
    TerminateProcess(child.process, 1);
    WaitForSingleObject(child.process, 1000);
    child.close_pipes_and_handles();
    return false;
  }
  exit_code_out = static_cast<int>(exit_code);
  child.close_pipes_and_handles();
  return !timed_out;
}

bool run_retained_lockstep(const std::string& bin, const std::vector<std::string>& requests,
                           std::vector<std::string>& responses) {
  responses.clear();
  ChildPipes child;
  if (!spawn_worker_win(bin, {"--retained-ndjson"}, child)) return false;

  auto& wd = get_watchdog();
  PipeLineReader reader;
  bool ok = true;
  for (const auto& req : requests) {
    wd.begin_op(child.process, kWorkerTimeoutMs);
    std::string resp;
    const bool step_ok =
        write_all_win(child.in_write, req) && reader.read_line(child.out_read, kMaxOutputBytes, resp);
    const bool timed_out = wd.end_op();
    if (!step_ok || timed_out) {
      ok = false;
      break;
    }
    responses.push_back(std::move(resp));
  }

  CloseHandle(child.in_write);
  child.in_write = INVALID_HANDLE_VALUE;
  if (ok) {
    wd.begin_op(child.process, kWorkerTimeoutMs);
    const bool clean_eof = drain_expect_eof_win(child.out_read, reader);
    const DWORD wait_rc = WaitForSingleObject(child.process, kWorkerTimeoutMs);
    DWORD exit_code = 1;
    const bool timed_out = wd.end_op();
    if (!clean_eof || timed_out || wait_rc != WAIT_OBJECT_0 ||
        !GetExitCodeProcess(child.process, &exit_code) || exit_code != 0) {
      ok = false;
    }
  }
  if (!ok) {
    TerminateProcess(child.process, 1);
    WaitForSingleObject(child.process, 1000);
  }
  child.close_pipes_and_handles();
  return ok;
}
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

bool waitpid_deadline(pid_t pid, int& status_out,
                      std::chrono::steady_clock::time_point deadline) {
  while (true) {
    const pid_t w = waitpid(pid, &status_out, WNOHANG);
    if (w == pid) return true;
    if (w < 0) {
      if (errno == EINTR) continue;
      return false;
    }
    if (std::chrono::steady_clock::now() >= deadline) return false;
    usleep(500);
  }
}

bool spawn_worker_posix(const std::string& bin, const std::vector<std::string>& args,
                        int& in_write_out, int& out_read_out, pid_t& pid_out) {
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

    std::vector<char*> argv_exec;
    argv_exec.reserve(args.size() + 2);
    argv_exec.push_back(const_cast<char*>(bin.c_str()));
    for (const auto& a : args) argv_exec.push_back(const_cast<char*>(a.c_str()));
    argv_exec.push_back(nullptr);
    execvp(bin.c_str(), argv_exec.data());
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

bool run_invocation_raw(const std::string& bin, const std::vector<std::string>& args,
                        const std::string& stdin_bytes, std::string& stdout_bytes,
                        int& exit_code_out) {
  stdout_bytes.clear();
  exit_code_out = -1;
  int in_write = -1;
  int out_read = -1;
  pid_t pid = -1;
  if (!spawn_worker_posix(bin, args, in_write, out_read, pid)) return false;

  const auto deadline =
      std::chrono::steady_clock::now() + std::chrono::milliseconds(kWorkerTimeoutMs);
  bool io_ok = write_all_posix(in_write, stdin_bytes, deadline);
  close(in_write);

  PipeLineReader reader;
  if (io_ok) io_ok = reader.read_line(out_read, kMaxOutputBytes, deadline, stdout_bytes);
  if (io_ok) io_ok = drain_expect_eof_posix(out_read, reader, deadline);
  close(out_read);

  int status = 0;
  if (!io_ok || !waitpid_deadline(pid, status, deadline) || !WIFEXITED(status)) {
    kill(pid, SIGKILL);
    waitpid(pid, &status, 0);
    return false;
  }
  exit_code_out = WEXITSTATUS(status);
  return true;
}

bool run_retained_lockstep(const std::string& bin, const std::vector<std::string>& requests,
                           std::vector<std::string>& responses) {
  responses.clear();
  int in_write = -1;
  int out_read = -1;
  pid_t pid = -1;
  if (!spawn_worker_posix(bin, {"--retained-ndjson"}, in_write, out_read, pid)) return false;

  PipeLineReader reader;
  bool ok = true;
  for (const auto& req : requests) {
    const auto deadline =
        std::chrono::steady_clock::now() + std::chrono::milliseconds(kWorkerTimeoutMs);
    std::string resp;
    if (!write_all_posix(in_write, req, deadline) ||
        !reader.read_line(out_read, kMaxOutputBytes, deadline, resp)) {
      ok = false;
      break;
    }
    responses.push_back(std::move(resp));
  }

  close(in_write);
  const auto shutdown_deadline =
      std::chrono::steady_clock::now() + std::chrono::milliseconds(kWorkerTimeoutMs);
  int status = 0;
  if (ok) {
    if (!drain_expect_eof_posix(out_read, reader, shutdown_deadline) ||
        !waitpid_deadline(pid, status, shutdown_deadline) || !WIFEXITED(status) ||
        WEXITSTATUS(status) != 0) {
      ok = false;
    }
  }
  close(out_read);
  if (!ok) {
    kill(pid, SIGKILL);
    waitpid(pid, &status, 0);
  }
  return ok;
}
#endif

bool run_single_invocation(const std::string& bin, const std::vector<std::string>& args,
                           const std::string& stdin_bytes, std::string& stdout_bytes) {
  int exit_code = -1;
  return run_invocation_raw(bin, args, stdin_bytes, stdout_bytes, exit_code) && exit_code == 0;
}

std::string resolve_default_binary() {
  std::error_code ec;
#if defined(_WIN32)
  if (std::filesystem::exists("native/.build/recognizer_bench.exe", ec)) {
    return "native/.build/recognizer_bench.exe";
  }
  if (std::filesystem::exists("recognizer_bench.exe", ec)) return "recognizer_bench.exe";
  if (std::filesystem::exists("recognizer.exe", ec)) return "recognizer.exe";
  return "recognizer_bench.exe";
#else
  if (std::filesystem::exists("native/.build/recognizer_bench", ec)) {
    return "native/.build/recognizer_bench";
  }
  if (std::filesystem::exists("./recognizer_bench", ec)) return "./recognizer_bench";
  if (std::filesystem::exists("./recognizer", ec)) return "./recognizer";
  return "./recognizer_bench";
#endif
}

template <typename FailFn>
void verify_score_rule_oracles(FailFn& fail) {
  const double accept_exact = costellar_score_rules::kAcceptResidual;
  const double accept_below = std::nextafter(accept_exact, 0.0);
  const double accept_above = std::nextafter(accept_exact, 1.0);
  if (accept_exact != 0.18) fail("Expected kAcceptResidual == 0.18");
  if (!costellar_score_rules::is_residual_accepted(0.0)) fail("0.0 should be accepted");
  if (!costellar_score_rules::is_residual_accepted(accept_below)) {
    fail("std::nextafter(0.18, 0.0) should be accepted");
  }
  if (!costellar_score_rules::is_residual_accepted(accept_exact)) {
    fail("Exact 0.18 cutoff should be accepted");
  }
  if (costellar_score_rules::is_residual_accepted(accept_above)) {
    fail("std::nextafter(0.18, 1.0) must be rejected");
  }
  if (costellar_score_rules::is_residual_accepted(std::numeric_limits<double>::infinity())) {
    fail("+Inf residual must be rejected");
  }
  if (costellar_score_rules::is_residual_accepted(std::numeric_limits<double>::quiet_NaN())) {
    fail("NaN residual must be rejected");
  }

  const double gap_exact = costellar_score_rules::kAmbiguityGap;
  const double gap_below = std::nextafter(gap_exact, 0.0);
  const double gap_above = std::nextafter(gap_exact, 1.0);
  if (gap_exact != 0.015) fail("Expected kAmbiguityGap == 0.015");
  if (std::string(costellar_score_rules::classify_match_status(0, 0.0, 0.0)) != "NO_MATCH") {
    fail("0 candidates must classify as NO_MATCH");
  }
  if (std::string(costellar_score_rules::classify_match_status(1, accept_exact, 0.0)) !=
      "FULL_MATCH") {
    fail("1 candidate at 0.18 must classify as FULL_MATCH");
  }
  if (std::string(costellar_score_rules::classify_match_status(2, 0.0, gap_below)) !=
      "AMBIGUOUS") {
    fail("Gap std::nextafter(0.015, 0.0) must classify as AMBIGUOUS");
  }
  if (std::string(costellar_score_rules::classify_match_status(2, 0.0, gap_exact)) !=
      "AMBIGUOUS") {
    fail("Exact 0.015 gap must classify as AMBIGUOUS");
  }
  if (std::string(costellar_score_rules::classify_match_status(2, 0.0, gap_above)) !=
      "FULL_MATCH") {
    fail("Gap std::nextafter(0.015, 1.0) must classify as FULL_MATCH");
  }

  // Test IEEE-754 subtraction cliff (second - best <= 0.015) at non-zero baselines.
  for (double best : {0.10, 0.165}) {
    double at_cliff = best + gap_exact;
    while ((at_cliff - best) > gap_exact) {
      at_cliff = std::nextafter(at_cliff, 0.0);
    }
    while ((std::nextafter(at_cliff, 1.0) - best) <= gap_exact) {
      at_cliff = std::nextafter(at_cliff, 1.0);
    }
    const double above_cliff = std::nextafter(at_cliff, 1.0);
    if (!costellar_score_rules::is_ambiguity_gap(best, at_cliff)) {
      fail("Expected inclusive ambiguity at IEEE-754 cliff");
    }
    if (costellar_score_rules::is_ambiguity_gap(best, above_cliff)) {
      fail("Expected non-ambiguous 1 ULP above IEEE-754 cliff");
    }
    if (std::string(costellar_score_rules::classify_match_status(2, best, at_cliff)) !=
        "AMBIGUOUS") {
      fail("Expected AMBIGUOUS status at IEEE-754 cliff");
    }
    if (std::string(costellar_score_rules::classify_match_status(2, best, above_cliff)) !=
        "FULL_MATCH") {
      fail("Expected FULL_MATCH status 1 ULP above IEEE-754 cliff");
    }
    if (std::string(costellar_score_rules::classify_match_status(3, best, above_cliff)) !=
        "FULL_MATCH") {
      fail("3rd candidate must not create ambiguity when top-2 gap exceeds 0.015");
    }
  }
}

template <typename FailFn>
void verify_parsed_match_invariants(const std::string& label, const Pattern& expected_pat,
                                    const std::string& raw_out, double max_expected_residual,
                                    FailFn& fail) {
  ParsedResponse parsed;
  if (!parse_response_line(raw_out, parsed)) {
    fail(label + ": unparseable JSON response: " + raw_out);
    return;
  }
  if (parsed.status != "FULL_MATCH" && parsed.status != "AMBIGUOUS") {
    fail(label + ": expected FULL_MATCH or AMBIGUOUS, got " + parsed.status);
    return;
  }
  if (!parsed.hasBestMatch || parsed.candidates.empty()) {
    fail(label + ": missing candidates/bestMatch");
    return;
  }
  if (parsed.bestMatch.patternId != parsed.candidates[0].patternId ||
      parsed.bestMatch.constellationId != parsed.candidates[0].constellationId ||
      std::abs(parsed.bestMatch.residual - parsed.candidates[0].residual) > 1e-9) {
    fail(label + ": bestMatch disagrees with candidates[0]");
  }
  const std::string expected_status = costellar_score_rules::classify_match_status(
      parsed.candidates.size(), parsed.candidates[0].residual,
      parsed.candidates.size() > 1 ? parsed.candidates[1].residual : 0.0);
  if (parsed.status != expected_status && parsed.candidates.size() > 1) {
    // Allow 1e-6 formatting tolerance when formatted residuals straddle 0.015.
    const double gap = parsed.candidates[1].residual - parsed.candidates[0].residual;
    if (std::abs(gap - costellar_score_rules::kAmbiguityGap) > 2e-6) {
      fail(label + ": status " + parsed.status + " disagrees with score rules (" +
           expected_status + ")");
    }
  }
  bool found_expected = false;
  std::set<std::string> seen_constellations;
  for (size_t j = 0; j < parsed.candidates.size(); ++j) {
    const auto& c = parsed.candidates[j];
    if (!seen_constellations.insert(c.constellationId).second) {
      fail(label + ": duplicate constellationId in candidates");
    }
    if (j > 0 && c.residual + 1e-12 < parsed.candidates[j - 1].residual) {
      fail(label + ": candidates not sorted ascending by residual");
    }
    if (c.residual > costellar_score_rules::kAcceptResidual + 1e-6) {
      fail(label + ": candidate exceeded 0.18 acceptance cutoff");
    }
    if (c.patternId == expected_pat.id && c.constellationId == expected_pat.constellationId &&
        c.patternName == expected_pat.name && c.residual <= max_expected_residual) {
      found_expected = true;
    }
  }
  if (!found_expected) {
    fail(label + ": expected pattern " + expected_pat.id + " missing or residual exceeded limit");
  }
}

std::vector<Point> shift_to_x_extreme(const std::vector<Point>& pts, double target_extreme,
                                      bool use_max) {
  size_t extreme_idx = 0;
  for (size_t i = 1; i < pts.size(); ++i) {
    if (use_max ? (pts[i].x > pts[extreme_idx].x) : (pts[i].x < pts[extreme_idx].x)) {
      extreme_idx = i;
    }
  }
  const double dx = target_extreme - pts[extreme_idx].x;
  std::vector<Point> out = pts;
  for (auto& p : out) p.x += dx;
  out[extreme_idx].x = target_extreme;
  return out;
}

template <typename FailFn>
void verify_legacy_contract_suite(const std::string& target_bin, bool is_unmodified_legacy,
                                  FailFn& fail) {
  const std::string tag = is_unmodified_legacy ? "[legacy-prod]" : "[bench-default]";

  // 1. All 24 catalog patterns in unmodified text format.
  for (const auto& pat : kPatterns) {
    std::string out;
    if (!run_single_invocation(target_bin, {}, to_legacy_text(pat.points), out)) {
      fail(tag + " legacy text invocation failed for " + pat.id);
      continue;
    }
    verify_parsed_match_invariants(tag + " " + pat.id, pat, out, 1e-6, fail);
  }

  // 2. Transform, mild noise, and coordinate boundaries (exact +-1e6 vs +-1000001).
  const Pattern* cas_fwd = nullptr;
  for (const auto& pat : kPatterns) {
    if (pat.id == "Cas_fwd") {
      cas_fwd = &pat;
      break;
    }
  }
  if (cas_fwd == nullptr) {
    fail(tag + " Cas_fwd missing from catalog");
    return;
  }

  {
    std::string out;
    const auto tf = apply_similarity_transform(cas_fwd->points, 2.5, 37.0, -420.0, 185.0);
    if (!run_single_invocation(target_bin, {}, to_legacy_text(tf), out)) {
      fail(tag + " similarity transform failed");
    } else {
      verify_parsed_match_invariants(tag + " similarity Cas_fwd", *cas_fwd, out, 1e-5, fail);
    }
  }
  {
    std::string out;
    const auto noisy = perturbed_verify_copy(cas_fwd->points, 1.17, 4.2, 800.0, -300.0, 0.01);
    if (!run_single_invocation(target_bin, {}, to_legacy_text(noisy), out)) {
      fail(tag + " noisy Cas_fwd failed");
    } else {
      verify_parsed_match_invariants(tag + " noisy Cas_fwd", *cas_fwd, out,
                                     costellar_score_rules::kAcceptResidual, fail);
    }
  }
  for (double bound : {1000000.0, -1000000.0}) {
    std::string out;
    const auto shifted = shift_to_x_extreme(cas_fwd->points, bound, bound > 0.0);
    if (!run_single_invocation(target_bin, {}, to_legacy_text(shifted), out)) {
      fail(tag + " exact 1e6 coordinate bound failed");
    } else {
      verify_parsed_match_invariants(tag + " exact +-1e6", *cas_fwd, out, 1e-5, fail);
    }
  }

  // 3. Rejection / boundary / malformed text inputs.
  std::vector<Point> circle_128;
  for (int i = 0; i < 128; ++i) {
    const double ang = 2.0 * 3.14159265358979323846 * static_cast<double>(i) / 128.0;
    circle_128.push_back({100.0 * std::cos(ang), 100.0 * std::sin(ang)});
  }
  std::vector<Point> reflected;
  for (const auto& p : cas_fwd->points) reflected.push_back({-p.x, p.y});
  std::vector<Point> reordered = cas_fwd->points;
  std::swap(reordered[1], reordered[2]);
  std::vector<Point> deformed = cas_fwd->points;
  deformed[deformed.size() / 2].x += 30.0;
  std::vector<Point> too_many(129, {1.0, 2.0});
  for (size_t i = 0; i < too_many.size(); ++i) {
    too_many[i] = {static_cast<double>(i), static_cast<double>((i * 3) % 11)};
  }

  const std::vector<std::string> legacy_no_match = {
      to_legacy_text({{0.0, 0.0}, {10.0, 0.0}, {4.0, 9.0}}),
      to_legacy_text(circle_128),
      to_legacy_text(reflected),
      to_legacy_text(reordered),
      to_legacy_text(deformed),
      to_legacy_text({{0.0, 0.0}, {10.0, 10.0}}),
      to_legacy_text(too_many),
      to_legacy_text({{10.0, 10.0}, {10.0, 10.0}, {10.0, 10.0}}),
      to_legacy_text({{0.0, 0.0}, {0.0, 0.0}, {100.0, 100.0}}),
      to_legacy_text(shift_to_x_extreme(cas_fwd->points, 1000001.0, true)),
      to_legacy_text(shift_to_x_extreme(cas_fwd->points, -1000001.0, false)),
      "0\n",
      "-1\n",
      "129\n",
      "3\nnan 0\n1 0\n0 1\n",
      "3\ninf 0\n1 0\n0 1\n",
      "3\n0 0\n1 0\n",
      "not_a_number\n",
      "",
  };
  for (size_t i = 0; i < legacy_no_match.size(); ++i) {
    std::string out;
    if (!run_single_invocation(target_bin, {}, legacy_no_match[i], out)) {
      fail(tag + " legacy NO_MATCH case #" + std::to_string(i) + " failed");
    } else if (out != kExpectedNoMatch) {
      fail(tag + " legacy NO_MATCH case #" + std::to_string(i) + " unexpected output: " + out);
    }
  }

  // Subsequent valid invocation after malformed inputs.
  {
    std::string out;
    if (!run_single_invocation(target_bin, {}, to_legacy_text(cas_fwd->points), out)) {
      fail(tag + " post-malformed valid legacy call failed");
    } else {
      verify_parsed_match_invariants(tag + " post-malformed Cas_fwd", *cas_fwd, out, 1e-6, fail);
    }
  }

  if (is_unmodified_legacy) {
    // Production binary (without COSTELLAR_OFFLINE_BENCH) must ignore experimental flags
    // and preserve legacy text stdin/stdout behavior.
    std::string out;
    if (!run_single_invocation(target_bin, {"--oneshot-ndjson"}, to_legacy_text(cas_fwd->points),
                               out)) {
      fail(tag + " production binary rejected/dispatched on --oneshot-ndjson flag");
    } else {
      verify_parsed_match_invariants(tag + " prod ignores --oneshot-ndjson", *cas_fwd, out, 1e-6,
                                     fail);
    }
  }
}

}  // namespace

int main(int argc, char** argv) {
#if defined(COSTELLAR_POSIX_PIPES)
  std::signal(SIGPIPE, SIG_IGN);
#endif
  const std::string bench_bin = argc > 1 ? argv[1] : resolve_default_binary();
  const bool has_separate_legacy = argc > 2 && std::string(argv[2]).size() > 0;
  const std::string legacy_bin = has_separate_legacy ? argv[2] : "";

  int failures = 0;
  auto fail = [&](const std::string& msg) {
    std::cerr << "FAIL: " << msg << "\n";
    ++failures;
  };

  // 1. Direct score-rule oracles (exact & std::nextafter-adjacent 0.18 and 0.015 cliffs).
  verify_score_rule_oracles(fail);

  // 2. Catalog invariants: 24 ordered traversals across 12 constellations, 3..128 points each.
  if (kPatterns.size() != kExpectedPatternCount) {
    fail("Expected 24 catalog patterns, got " + std::to_string(kPatterns.size()));
  }
  std::set<std::string> constellations;
  for (const auto& p : kPatterns) {
    constellations.insert(p.constellationId);
    if (p.points.size() < 3 || p.points.size() > 128) {
      fail("Catalog pattern out of point bounds: " + p.id);
    }
  }
  if (constellations.size() != kExpectedConstellationCount) {
    fail("Expected 12 distinct constellations, got " + std::to_string(constellations.size()));
  }

  // 3. Catalog patterns: legacy-text == oneshot-ndjson == retained-ndjson byte-for-byte.
  std::vector<std::string> catalog_requests;
  std::vector<std::string> catalog_oneshot_outputs;
  for (size_t i = 0; i < kPatterns.size(); ++i) {
    const auto& pat = kPatterns[i];
    const std::string ndjson_req = to_ndjson(pat.points, (i % 2 == 0));
    const std::string text_req = to_legacy_text(pat.points);
    catalog_requests.push_back(ndjson_req);

    std::string legacy_out;
    std::string oneshot_out;
    if (!run_single_invocation(bench_bin, {}, text_req, legacy_out)) {
      fail("Bench default legacy invocation failed for pattern " + pat.id);
      continue;
    }
    if (!run_single_invocation(bench_bin, {"--oneshot-ndjson"}, ndjson_req, oneshot_out)) {
      fail("Oneshot NDJSON invocation failed for pattern " + pat.id);
      continue;
    }
    if (legacy_out != oneshot_out) {
      fail("Byte mismatch between default text and oneshot NDJSON for " + pat.id);
    }
    catalog_oneshot_outputs.push_back(oneshot_out);
    verify_parsed_match_invariants("[catalog] " + pat.id, pat, oneshot_out, 1e-6, fail);
  }

  std::vector<std::string> catalog_retained_outputs;
  if (!run_retained_lockstep(bench_bin, catalog_requests, catalog_retained_outputs)) {
    fail("Retained lockstep run failed over catalog patterns");
  } else if (catalog_retained_outputs != catalog_oneshot_outputs) {
    fail("Byte mismatch between oneshot and retained outputs on catalog patterns");
  }

  // 4. Similarity transform, mild noise, +-1e6 bounds, \uXXXX escapes, depth 32, and 32 KiB cliff.
  const Pattern* cas_fwd = nullptr;
  for (const auto& pat : kPatterns) {
    if (pat.id == "Cas_fwd") {
      cas_fwd = &pat;
      break;
    }
  }
  if (cas_fwd == nullptr) {
    fail("Cas_fwd missing from catalog");
    return 1;
  }

  const std::string tf_ndjson =
      to_ndjson(apply_similarity_transform(cas_fwd->points, 2.5, 37.0, -420.0, 185.0), true);
  std::string transformed_oneshot_out;
  {
    std::string tf_legacy_out;
    const std::string tf_text =
        to_legacy_text(apply_similarity_transform(cas_fwd->points, 2.5, 37.0, -420.0, 185.0));
    if (!run_single_invocation(bench_bin, {}, tf_text, tf_legacy_out) ||
        !run_single_invocation(bench_bin, {"--oneshot-ndjson"}, tf_ndjson,
                               transformed_oneshot_out)) {
      fail("Transformed similarity invocation failed for Cas_fwd");
    } else {
      if (tf_legacy_out != transformed_oneshot_out) {
        fail("Byte mismatch between default text and oneshot on transformed Cas_fwd");
      }
      verify_parsed_match_invariants("[transformed] Cas_fwd", *cas_fwd, transformed_oneshot_out,
                                     1e-5, fail);
    }
  }

  const std::string noisy_ndjson =
      to_ndjson(perturbed_verify_copy(cas_fwd->points, 1.17, 4.2, 800.0, -300.0, 0.01));
  std::string noisy_out;
  if (!run_single_invocation(bench_bin, {"--oneshot-ndjson"}, noisy_ndjson, noisy_out)) {
    fail("Oneshot failed on noisy transformed Cas_fwd");
  } else {
    verify_parsed_match_invariants("[noisy] Cas_fwd", *cas_fwd, noisy_out,
                                   costellar_score_rules::kAcceptResidual, fail);
  }

  const std::string escaped_cas_ndjson = [&]() {
    std::ostringstream oss;
    oss.imbue(std::locale::classic());
    oss << std::setprecision(15) << "{\"\\u0070oints\":[";
    for (size_t i = 0; i < cas_fwd->points.size(); ++i) {
      if (i) oss << ",";
      oss << "{\"\\u0078\":" << cas_fwd->points[i].x << ",\"\\u0079\":" << cas_fwd->points[i].y
          << "}";
    }
    oss << "],\"underflow\":1e-400}\n";
    return oss.str();
  }();

  const std::string cas_plus_1e6_ndjson = to_ndjson(shift_to_x_extreme(cas_fwd->points, 1e6, true));
  const std::string cas_minus_1e6_ndjson =
      to_ndjson(shift_to_x_extreme(cas_fwd->points, -1e6, false));

  // Exact 32 KiB (32768 bytes before '\n') valid request vs 32769 bytes oversized request.
  const std::string base_cas_ndjson = to_ndjson(cas_fwd->points, false);
  const std::string base_cas_no_nl = base_cas_ndjson.substr(0, base_cas_ndjson.size() - 1);
  if (base_cas_no_nl.size() >= kMaxRequestBytes) {
    fail("Unexpected Cas_fwd base payload size >= 32 KiB");
    return 1;
  }
  const std::string exact_32k_req =
      base_cas_no_nl + std::string(kMaxRequestBytes - base_cas_no_nl.size(), ' ') + "\n";
  const std::string over_32k_req =
      base_cas_no_nl + std::string(kMaxRequestBytes - base_cas_no_nl.size() + 1, ' ') + "\n";

  // Depth 32 (31 nested arrays inside unknown field -> depth 32 for leaf) vs Depth 33.
  const std::string depth_32_req =
      std::string("{\"meta\":") + std::string(31, '[') + "1" + std::string(31, ']') + "," +
      base_cas_no_nl.substr(1) + "\n";
  const std::string depth_33_req =
      std::string("{\"meta\":") + std::string(32, '[') + "1" + std::string(32, ']') + "," +
      base_cas_no_nl.substr(1) + "\n";

  const std::vector<std::string> valid_boundary_requests = {
      escaped_cas_ndjson,
      cas_plus_1e6_ndjson,
      cas_minus_1e6_ndjson,
      exact_32k_req,
      depth_32_req,
  };
  std::vector<std::string> valid_boundary_oneshot_outs;
  for (size_t i = 0; i < valid_boundary_requests.size(); ++i) {
    std::string out;
    if (!run_single_invocation(bench_bin, {"--oneshot-ndjson"}, valid_boundary_requests[i], out)) {
      fail("Oneshot failed on valid boundary fixture #" + std::to_string(i));
    } else {
      verify_parsed_match_invariants("[valid-boundary #" + std::to_string(i) + "]", *cas_fwd, out,
                                     1e-5, fail);
    }
    valid_boundary_oneshot_outs.push_back(out);
  }
  {
    std::vector<std::string> ret_outs;
    if (!run_retained_lockstep(bench_bin, valid_boundary_requests, ret_outs) ||
        ret_outs != valid_boundary_oneshot_outs) {
      fail("Retained parity failed on valid boundary requests");
    }
  }

  // 5. Explicit NO_MATCH fixtures (boundaries, deformations, degeneracies, malformed JSON, >32 KiB).
  std::vector<Point> circle_128;
  for (int i = 0; i < 128; ++i) {
    const double ang = 2.0 * 3.14159265358979323846 * static_cast<double>(i) / 128.0;
    circle_128.push_back({100.0 * std::cos(ang), 100.0 * std::sin(ang)});
  }
  const std::vector<Point> tri_3 = {{0.0, 0.0}, {10.0, 0.0}, {4.0, 9.0}};
  const std::vector<Point> zigzag_deformed = {
      {0.0, 0.0}, {100.0, 0.01}, {0.02, 0.0}, {100.0, 0.03}, {0.04, 0.0}, {100.0, 0.05}};
  std::vector<Point> reflected;
  for (const auto& p : cas_fwd->points) reflected.push_back({-p.x, p.y});
  std::vector<Point> reordered = cas_fwd->points;
  std::swap(reordered[1], reordered[2]);
  std::vector<Point> deformed = cas_fwd->points;
  deformed[deformed.size() / 2].x += 30.0;

  const std::vector<Point> zero_norm = {{10.0, 10.0}, {10.0, 10.0}, {10.0, 10.0}};
  const std::vector<Point> zero_edge = {{0.0, 0.0}, {0.0, 0.0}, {100.0, 100.0}};
  const std::vector<Point> too_few = {{0.0, 0.0}, {10.0, 10.0}};
  std::vector<Point> too_many(129);
  for (int i = 0; i < 129; ++i) {
    too_many[static_cast<size_t>(i)] = {static_cast<double>(i) * 10.0,
                                        static_cast<double>(i % 7) * 15.0};
  }
  const std::string oversized_line =
      "{\"pad\":\"" + std::string(kMaxRequestBytes + 256, 'x') +
      "\",\"points\":[{\"x\":0,\"y\":0},{\"x\":10,\"y\":0},{\"x\":0,\"y\":10}]}\n";

  const std::vector<std::string> no_match_inputs = {
      to_ndjson(tri_3),
      to_ndjson(circle_128),
      to_ndjson(zigzag_deformed),
      to_ndjson(reflected),
      to_ndjson(reordered),
      to_ndjson(deformed),
      to_ndjson(zero_norm),
      to_ndjson(zero_edge),
      to_ndjson(too_few),
      to_ndjson(too_many),
      to_ndjson(shift_to_x_extreme(cas_fwd->points, 1000001.0, true)),
      to_ndjson(shift_to_x_extreme(cas_fwd->points, -1000001.0, false)),
      "{\"points\":[{\"x\":NaN,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"points\":[{\"x\":1e400,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"points\":[{\"x\":01,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]} trailing\n",
      "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}\n",
      "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":\"bad\",\"y\":1}]}\n",
      "{\"points\":[{\"x\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}],\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"points\":[{\"x\":0,\"x\":1,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      "{\"bad\":\"\\uD800\",\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":0,\"y\":1}]}\n",
      depth_33_req,
      over_32k_req,
      oversized_line,
      "\n",
      "{}\n",
  };

  for (size_t i = 0; i < no_match_inputs.size(); ++i) {
    std::string oneshot_out;
    if (!run_single_invocation(bench_bin, {"--oneshot-ndjson"}, no_match_inputs[i], oneshot_out)) {
      fail("Oneshot failed on NO_MATCH fixture #" + std::to_string(i));
    } else if (oneshot_out != kExpectedNoMatch) {
      fail("Expected NO_MATCH on fixture #" + std::to_string(i) + ", got: " + oneshot_out);
    }
  }

  // Empty 0-byte stdin framing check: oneshot emits NO_MATCH; retained emits 0 lines and exits 0.
  {
    std::string empty_oneshot;
    if (!run_single_invocation(bench_bin, {"--oneshot-ndjson"}, "", empty_oneshot) ||
        empty_oneshot != kExpectedNoMatch) {
      fail("Empty stdin oneshot should emit NO_MATCH");
    }
    std::vector<std::string> empty_ret;
    if (!run_retained_lockstep(bench_bin, {}, empty_ret) || !empty_ret.empty()) {
      fail("Empty stdin retained should exit 0 with 0 output lines");
    }
  }

  // Invalid CLI mode flag on bench binary must return exit code 1 with kNoMatchJson.
  {
    std::string bad_flag_out;
    int bad_flag_rc = 0;
    if (!run_invocation_raw(bench_bin, {"--invalid-mode"}, "", bad_flag_out, bad_flag_rc) ||
        bad_flag_rc != 1 || bad_flag_out != kExpectedNoMatch) {
      fail("Bench binary invalid CLI flag must exit 1 with NO_MATCH JSON");
    }
  }

  // 6. Retained worker state isolation: malformed -> 32769 oversized -> depth 33 ->
  // degenerate -> valid -> non-JSON -> valid -> null coord -> exact 32768 -> valid transformed.
  std::vector<std::string> interleaved_requests = {
      "{\"points\":[truncated\n",
      over_32k_req,
      oversized_line,
      depth_33_req,
      to_ndjson(zero_norm),
      catalog_requests.front(),
      "not-json\n",
      catalog_requests.back(),
      "{\"points\":[{\"x\":0,\"y\":0},{\"x\":1,\"y\":0},{\"x\":null,\"y\":1}]}\n",
      exact_32k_req,
      tf_ndjson,
  };
  std::vector<std::string> expected_interleaved = {
      kExpectedNoMatch,
      kExpectedNoMatch,
      kExpectedNoMatch,
      kExpectedNoMatch,
      kExpectedNoMatch,
      catalog_oneshot_outputs.front(),
      kExpectedNoMatch,
      catalog_oneshot_outputs.back(),
      kExpectedNoMatch,
      valid_boundary_oneshot_outs[3],
      transformed_oneshot_out,
  };

  std::vector<std::string> interleaved_outputs;
  if (!run_retained_lockstep(bench_bin, interleaved_requests, interleaved_outputs)) {
    fail("Retained lockstep failed on malformed-then-valid reset sequence");
  } else if (interleaved_outputs != expected_interleaved) {
    fail("State contamination or byte mismatch across malformed-then-valid reset sequence");
  }

  // 7. Independent unmodified legacy contract (separate production binary if passed in argv[2]).
  if (has_separate_legacy) {
    verify_legacy_contract_suite(legacy_bin, true, fail);
  } else {
    verify_legacy_contract_suite(bench_bin, false, fail);
  }

  if (failures != 0) {
    std::cerr << failures << " contract assertion(s) failed.\n";
    return 1;
  }
  std::cout << "All Stage 2 contract checks passed (score rules exact/nextafter, NDJSON parity, "
               "boundaries, retained reset, legacy suite: "
            << (has_separate_legacy ? "separate unmodified binary" : "bench default mode only")
            << ").\n";
  return 0;
}
