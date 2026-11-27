#include <algorithm>
#include <cmath>
#include <iomanip>
#include <iostream>
#include <limits>
#include <map>
#include <string>
#include <vector>
#include "catalog.generated.hpp"

static constexpr double kAcceptResidual = 0.18;
static constexpr double kAmbiguityGap = 0.015;

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
  ax/=a.size();ay/=a.size();bx/=a.size();by/=b.size();
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

int main(){
  std::ios::sync_with_stdio(false);
  int n=0; if(!(std::cin>>n) || n<3 || n>128){std::cout<<"{\"status\":\"NO_MATCH\",\"candidates\":[],\"bestMatch\":null}\n";return 0;}
  std::vector<Point> input(n); for(auto& p:input) if(!(std::cin>>p.x>>p.y) || !std::isfinite(p.x)||!std::isfinite(p.y)||std::abs(p.x)>1e6||std::abs(p.y)>1e6){std::cout<<"{\"status\":\"NO_MATCH\",\"candidates\":[],\"bestMatch\":null}\n";return 0;}
  double inNorm=norm(input); if(inNorm<1e-8){std::cout<<"{\"status\":\"NO_MATCH\",\"candidates\":[],\"bestMatch\":null}\n";return 0;}
  std::vector<Score> scores;
  for(const auto& p:kPatterns){if(p.points.size()!=input.size())continue;Score s{&p,0,0,0};if(fit(input,p.points,s)&&s.residual<=kAcceptResidual)scores.push_back(s);}
  std::sort(scores.begin(),scores.end(),[](auto&a,auto&b){return a.residual<b.residual;});
  // Return the best traversal per distinct constellation; nearby duplicate traversals do not create ambiguity.
  std::map<std::string,Score> unique;
  for(auto s:scores){auto it=unique.find(s.p->constellationId);if(it==unique.end())unique.emplace(s.p->constellationId,s);}
  std::vector<Score> result;for(auto& kv:unique)result.push_back(kv.second);
  std::sort(result.begin(),result.end(),[](auto&a,auto&b){return a.residual<b.residual;});
  bool ambiguous=result.size()>1 && result[1].residual-result[0].residual<=kAmbiguityGap;
  std::cout<<std::fixed<<std::setprecision(6)<<"{\"status\":\""<<(result.empty()?"NO_MATCH":ambiguous?"AMBIGUOUS":"FULL_MATCH")<<"\",\"candidates\":[";
  for(size_t i=0;i<result.size();++i){auto s=result[i];if(i)std::cout<<",";std::cout<<"{\"patternId\":\""<<s.p->id<<"\",\"constellationId\":\""<<s.p->constellationId<<"\",\"patternName\":\""<<s.p->name<<"\",\"residual\":"<<s.residual<<",\"isVerified\":true,\"rotationDeg\":"<<s.angle<<",\"scale\":"<<s.scale<<"}";}
  std::cout<<"],\"bestMatch\":";
  if(result.empty())std::cout<<"null";else{auto s=result[0];std::cout<<"{\"patternId\":\""<<s.p->id<<"\",\"constellationId\":\""<<s.p->constellationId<<"\",\"patternName\":\""<<s.p->name<<"\",\"residual\":"<<s.residual<<",\"isVerified\":true,\"rotationDeg\":"<<s.angle<<",\"scale\":"<<s.scale<<"}";}
  std::cout<<"}\n";
}
