# Gates: Costellar redesign
Scope: Replacement UI and full core workflow verification

- [x] G1: Production TypeScript and bundling succeed
  CHECK: npm.cmd run build
  EXPECT: built in
  EVIDENCE: automatic-evidence=v1; definition-sha256=69a2887a3018368a51179e47d6fd7f8c3bebb6aba733599b9f4becc7e39921d3; exit=0; EXPECT=matched; output-sha256=8c476413c64d2a2d60879a1f079b7e43c9f129c6880ffbd5f2c258d968e35f69; output-bytes=767; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\ommd3076\Proejcts\automata-theory; path=fe7be1bdebbf/37 entries

- [x] G2: App tests pass
  CHECK: npm.cmd test
  EXPECT: Test Files  10 passed (10)
  EVIDENCE: automatic-evidence=v1; definition-sha256=a2a1054b9ba7e4205c3532cbd54258864a28164de0b499f91d37618f962e41a1; exit=0; EXPECT=matched; output-sha256=0766c88a20773ba51f441af5a6faf3a98ae197069dde002725a8ddd4bab9b246; output-bytes=240; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\ommd3076\Proejcts\automata-theory; path=fe7be1bdebbf/37 entries

- [x] G3: Lint passes without warnings
  CHECK: npm.cmd run lint -- --deny-warnings && echo COSTELLAR_LINT_OK
  EXPECT: COSTELLAR_LINT_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b425c5946a6dfdc0f5776e63eaa2e7aef109971fa714827a1321a1303e8259b3; exit=0; EXPECT=matched; output-sha256=98dfca4c1e49a9321406363d32b6b961ee05d3c1756e5b0e86e0f0665b273cf0; output-bytes=69; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\ommd3076\Proejcts\automata-theory; path=fe7be1bdebbf/37 entries

- [x] G4: All route owners meet their individual desktop, mobile, and interaction constraints
  EVIDENCE: Final browser-2026-11-14T07-21-25-759Z/run-summary.json passed all browser assertions, saved 32 screenshots with zero page errors. Site checked at 1586×992, 1024×768 and 390×844.

- [x] G5: Supplied screen is the shared interior visual authority with no exterior restyle
  EVIDENCE: PaceOS interior compared visually with desktop Overview and route screenshots. Existing blue surround declarations preserved from the initial dirty checkout.

- [x] G6: Luna-only implementation, registry and UI Skills provenance, and weekly allowance are reviewed
  EVIDENCE: Eleven explicit GPT-6 Luna worker dispatches. UI Skills MCP supplied Baseline UI, Impeccable and Taste. ReUI base-nova Alert adapted from official raw registry after direct host DNS failure. Preview is localhost. Weekly allowance remained above 40%.
