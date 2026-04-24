# Environment Variables — `tools/presentation/`

이 하네스는 런타임 동작을 환경변수로 받는다. 모든 변수는 **선택**이며 기본값이 코드에 내장되어 있다. fork 사용자가 기본값을 그대로 써도 작동한다. 커스터마이징이 필요한 경우에만 shell export 또는 `.env` 파일로 설정한다.

## 변수 그룹

### Workspace 구조
| 변수 | 용도 | 비고 |
|---|---|---|
| `PPT_WORKSPACE_ROOT` | 프로젝트 폴더 루트 | 기본값 `tools/presentation/_workspace` (.gitignore 대상). 다른 경로를 쓰려면 shell export |
| `PPT_STATE_PATH` | 현재 프로젝트 state.json 절대경로 | skills가 자동 주입. 수동 설정 불필요 |

### 에디터 (slides-grab)
| 변수 | 용도 | 기본 |
|---|---|---|
| `PPT_EDIT_ENGINE` | AI 편집 엔진 | `claude` / `codex` 중 `claude` |
| `PPT_EDIT_ENGINE_STUB` | 테스트용 stub | 미설정. `1`이면 LLM 호출 없이 mock 응답 |
| `PPT_AGENT_EDIT_TIMEOUT_MS` | 에이전트 편집 타임아웃 | 코드 내 정의 |

### Design 스킬 (template-copy)
| 변수 | 용도 |
|---|---|
| `PPT_DESIGN_SKILL_PATH` | template-copy 스킬 경로 (자동 감지) |
| `PPT_DESIGN_SKILL_FALLBACK` | fallback 동작 플래그 |
| `PPT_DESIGN_DUPLICATE_PATTERNS` | 중복 패턴 허용 리스트 |
| `PPT_DESIGN_SECTION_HEADINGS` | 섹션 heading 규칙 |
| `PPT_COPY_PORT` | template-copy 서버 포트 |

### Agent 내부
| 변수 | 용도 |
|---|---|
| `PPT_AGENT_PACKAGE_ROOT` | agent 패키지 루트 |
| `PPT_AGENT_SLIDES_DIR` | agent가 참조하는 slides 디렉토리 |

## 설정 방법

- **일회성**: `export PPT_EDIT_ENGINE=codex && npm run editor`
- **반복**: `tools/presentation/.env` 파일 생성 (.gitignore 대상) 후 dotenv 로드
- **시스템**: Windows 환경변수 패널 또는 `~/.bashrc`에 export 라인 추가

## 실제 기본값 확인

코드 내 정의된 기본값·참조 위치는 직접 grep으로 확인한다.

```bash
cd tools/presentation
grep -rn "PPT_<VAR_NAME>" --include="*.ts" --include="*.js" --include="*.py" .
```

## 최소 설정으로 시작

아무 변수도 설정하지 않고 `npm install && npx playwright install chromium` 만 끝내도 기본 파이프라인(`presentation:plan` → `presentation:design` → `presentation:export`)은 작동한다. 환경변수는 **특정 동작을 덮어쓸 때만** 건드린다.
