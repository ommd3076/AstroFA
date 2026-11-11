# AstroFA: Computational Algorithms

This document provides detailed mathematical specifications of all core algorithms implemented in AstroFA.

---

## 1. Gnomonic Celestial Projection

To eliminate spherical distortion when analyzing stars in local sky regions, coordinates $(\alpha_i, \delta_i)$ in degrees are transformed to local tangent-plane 2D coordinates $(x_i, y_i)$ via Gnomonic projection:

Given spherical centroid $(\alpha_0, \delta_0)$ computed by averaging unit direction vectors:
$$\Delta \alpha = \alpha - \alpha_0$$
$$\cos(c) = \sin \delta_0 \sin \delta + \cos \delta_0 \cos \delta \cos \Delta \alpha$$
$$x = \frac{\cos \delta \sin \Delta \alpha}{\cos(c)}$$
$$y = \frac{\cos \delta_0 \sin \delta - \sin \delta_0 \cos \delta \cos \Delta \alpha}{\cos(c)}$$

**Property:** Great circles map strictly to straight lines on the projection plane, preserving collinearity and visual turning geometry.

---

## 2. Invariant Geometric Normalization

1. **Centroid Normalization:**
   $$\bar{x} = \frac{1}{N}\sum x_i, \quad \bar{y} = \frac{1}{N}\sum y_i$$
   $$x'_i = x_i - \bar{x}, \quad y'_i = y_i - \bar{y}$$

2. **Uniform Scale Normalization:**
   $$S = \sqrt{\frac{1}{N}\sum_{i=1}^N ({x'_i}^2 + {y'_i}^2)}$$
   $$x''_i = \frac{x'_i}{S}, \quad y''_i = \frac{y'_i}{S}$$

3. **Turning Angle Calculation:**
   For edge vectors $E_{i-1} = P'_i - P'_{i-1}$ and $E_i = P'_{i+1} - P'_i$:
   $$\theta_i = \text{atan2}(E_{i-1,x} E_{i,y} - E_{i-1,y} E_{i,x}, \; E_{i-1,x} E_{i,x} + E_{i-1,y} E_{i,y}) \times \frac{180^\circ}{\pi}$$

4. **Edge Length Ratio:**
   $$r_i = \frac{|E_i|}{|E_{i-1}|}$$

---

## 3. 2D Procrustes Analysis (Kabsch Algorithm)

To geometrically verify candidate shapes:
Given normalized test points $P$ and normalized reference points $Q$ ($N$ points, centered at origin):

1. Compute cross-covariance rotation terms:
   $$N_{\text{cov}} = \sum_{i=1}^N (Q_{i,x} P_{i,y} - Q_{i,y} P_{i,x})$$
   $$D_{\text{cov}} = \sum_{i=1}^N (Q_{i,x} P_{i,x} + Q_{i,y} P_{i,y})$$
2. Optimal alignment rotation angle:
   $$\phi = \text{atan2}(N_{\text{cov}}, D_{\text{cov}})$$
3. Rotate reference points $Q$ by $\phi$:
   $$Q'_{i,x} = Q_{i,x} \cos \phi - Q_{i,y} \sin \phi$$
   $$Q'_{i,y} = Q_{i,x} \sin \phi + Q_{i,y} \cos \phi$$
4. Compute residual Root Mean Square Error (RMSE):
   $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^N |P_i - Q'_i|^2}$$
5. If $\text{RMSE} \le 0.32$, the candidate shape is geometrically verified.
