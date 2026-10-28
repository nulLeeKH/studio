# studio

https://studio.nulleekh.com 의 소스. BURGESS1977™이 만든 것들을 한 페이지에 모읍니다. `products/`를 의존성 없는 Node 스크립트로 정적 HTML(한국어 `/`, 영어 `/en/`)로 만들고, GitHub Actions로 GitHub Pages에 배포합니다.

```bash
pnpm install   # Node 24+
pnpm dev       # http://127.0.0.1:8081
pnpm test
pnpm build     # dist/
```

## 제품

폴더 하나가 제품 하나이고, 폴더 이름 순서대로 나옵니다.

```
products/01-name/
  index.md
  thumbnail.png   # 선택, 1280×800 권장
```

```yaml
---
name: 이름                     # 필수
url: https://example.com       # 선택, 없으면 "준비 중"
summary_ko: 한 줄 설명         # 선택
summary_en: One-line summary   # summary_ko와 함께
---
```

본문은 쓰지 않습니다. 형식이 틀리면 빌드가 파일 경로와 함께 멈춥니다.

## 커밋

`<종류>: <내용>`, commitlint가 검사합니다.

| 종류 | 언제 |
|---|---|
| `product` | 제품 추가, 수정, 내림 |
| `site` | 디자인, 코드, 설정 |

## 배포

`main`에 push하면 배포됩니다(`.github/workflows/deploy.yml`).

## 라이선스

- 내용과 로고: © BURGESS1977™
- 폰트: [D2Coding](https://github.com/naver/d2codingfont) 1.3.3, SIL Open Font License 1.1 (`static/fonts/OFL.txt`).

A studio by [nulLeeKH](https://blog.nulleekh.com)
