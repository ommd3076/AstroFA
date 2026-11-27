#pragma once

#include <cstddef>

namespace costellar_score_rules {

inline constexpr double kAcceptResidual = 0.18;
inline constexpr double kAmbiguityGap = 0.015;

// Preserves the production inclusive <= comparison on the computed composite residual.
constexpr bool is_residual_accepted(double residual) noexcept {
  return residual <= kAcceptResidual;
}

// Preserves the production IEEE-754 subtraction and <= comparison:
// (second_residual - best_residual) <= 0.015.
constexpr bool is_ambiguity_gap(double best_residual, double second_residual) noexcept {
  return (second_residual - best_residual) <= kAmbiguityGap;
}

constexpr const char* classify_match_status(std::size_t candidate_count,
                                            double best_residual = 0.0,
                                            double second_residual = 0.0) noexcept {
  if (candidate_count == 0) return "NO_MATCH";
  if (candidate_count > 1 && is_ambiguity_gap(best_residual, second_residual)) {
    return "AMBIGUOUS";
  }
  return "FULL_MATCH";
}

}  // namespace costellar_score_rules
