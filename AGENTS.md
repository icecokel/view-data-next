# Workspace Agent Rules

## Commit Message Rules
- 커밋 메시지는 항상 한국어로 작성한다.
- 형식은 `type(scope):요약` 또는 `type:요약`으로 작성한다.
- `:` 뒤에는 공백을 넣지 않는다. 예: `feat:기능개발`
- `type`은 `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `ci`, `build`, `revert` 중 하나를 사용한다.
- 제목은 한 줄로 작성하고 불필요하게 길게 쓰지 않는다.
- 제목 끝에 마침표/문장부호(`.`, `!`, `?`)를 붙이지 않는다.

## File Naming Rules
- 파일 생성 시 파일명은 케밥케이스(`kebab-case`)로 작성한다.
- 케밥케이스 적용이 불가피하게 어려운 경우, 사유를 사용자에게 먼저 공유한다.

## Test Rules
- 코어 코드는 테스트 코드를 반드시 작성한다.
