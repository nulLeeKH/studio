# studio

https://studio.nulleekh.com 의 소스. BURGESS1977™이 만든 것들을 한 페이지에 모읍니다. `products/`를 Node 스크립트로 정적 HTML(한국어 `/`, 영어 `/en/`)로 만들고, GitHub Actions로 GitHub Pages에 배포합니다.

```bash
pnpm install   # Node 24+
pnpm dev       # http://127.0.0.1:8081
pnpm test
pnpm build     # dist/
```

## 제품

폴더 하나에 제품 소개와 문서, 이미지를 함께 둡니다. 제품 목록은 폴더 이름 순서대로 나오고, 정렬용 숫자 접두어(`01-` 등)는 공개 주소에서 제외합니다.

```
products/01-wesualizer/
  index.md
  thumbnail.png       # 선택, 1280×800 권장
  privacy/
    ko.md
    en.md
    diagram.png
  files/
    policy.pdf
```

루트 `index.md`의 앞부분은 제품 목록에 표시할 정보입니다.

```markdown
---
name: Wesualizer
url: https://example.com
summary_ko: 한 줄 설명
summary_en: One-line summary
draft: true
---

여기부터는 /wesualizer/에서 보여줄 본문입니다. 생략해도 됩니다.
```

`name`은 필수입니다. `url`이 없으면 목록에 "준비 중"으로 표시하고, `summary_ko`와 `summary_en`은 함께 씁니다. `draft: true`는 한국어/영어 제품 목록과 개수에서만 숨깁니다. 제품의 루트 페이지, 문서, 이미지, 첨부파일은 계속 공개되므로 처리방침을 먼저 배포할 수 있습니다. 목록에 공개할 때는 `draft` 줄을 지우거나 `false`로 바꿉니다.

제품 목록의 제목은 Studio 내부 프로젝트 페이지(`/wesualizer/` 등)로 연결됩니다. 제목 아래의 URL은 실제 서비스로 연결됩니다.

## 문서와 파일

`products/`와 정렬용 숫자 접두어를 뺀 경로가 주소가 됩니다. Markdown은 확장자 없이 HTML로 제공하고, 이미지와 나머지 파일은 확장자를 유지해 그대로 제공합니다. 각 폴더의 `index.md`는 그 폴더의 루트로 연결됩니다.

| 파일 | 주소 |
|---|---|
| `products/01-wesualizer/index.md` | `/wesualizer/` |
| `products/01-wesualizer/privacy/ko.md` | `/wesualizer/privacy/ko/` |
| `products/01-wesualizer/privacy/en.md` | `/wesualizer/privacy/en/` |
| `products/01-wesualizer/help/index.md` | `/wesualizer/help/` |
| `products/01-wesualizer/privacy/diagram.png` | `/wesualizer/privacy/diagram.png` |
| `products/01-wesualizer/files/policy.pdf` | `/wesualizer/files/policy.pdf` |

문서는 일반 Markdown으로 작성하면 됩니다. 첫 `#` 제목을 페이지 제목으로 사용하고, 제목이 없으면 파일 이름을 사용합니다. 기본 CommonMark 문법(제목, 강조, 인용, 목록, 코드, 구분선, 링크, 이미지 등)과 GFM 표, 취소선, 체크리스트, 각주를 지원합니다. 원시 HTML은 텍스트로 표시합니다.

루트 제품 소개를 제외한 문서는 선택적으로 아래 정보를 붙일 수 있습니다. `lang`은 `ko`(기본값) 또는 `en`입니다.

```markdown
---
title: Wesualizer Privacy Policy
lang: en
---

# Privacy Policy

Policy text.
```

이미지와 첨부파일, 문서 링크의 상대경로는 **원본 Markdown 파일이 있는 폴더**를 기준으로 처리합니다. 예를 들어 `privacy/ko.md`에서 다음과 같이 씁니다.

```markdown
![이미지의 내용을 설명하는 대체 텍스트](diagram.png "이미지 아래에 보일 캡션")
[English](en.md)
[첨부파일](../files/policy.pdf)
```

한 문단에 이미지 하나만 있으면 그림으로 표시하고, 따옴표 안의 제목을 하단 캡션으로 표시합니다. `![대체 텍스트]`는 스크린리더가 읽는 이미지 설명이며 캡션과 별개입니다. 캡션 문구는 툴팁으로 중복 표시하지 않습니다. 캡션을 생략해도 이미지와 대체 텍스트는 표시됩니다.

문서 링크의 `.md`는 빌드할 때 확장자 없는 주소로 변환합니다. 문서와 파일은 제품 목록에 자동으로 연결하지 않습니다.

제품·문서 경로는 영문 소문자, 숫자, 하이픈으로 씁니다. `en`이나 `static/`의 파일·폴더와 겹치는 제품 주소, 같은 주소가 되는 제품 또는 문서, 파일과 폴더의 충돌은 빌드에서 알려줍니다. 점으로 시작하는 파일·폴더는 배포하지 않고, 심볼릭 링크는 허용하지 않습니다. 나머지 파일은 모두 공개됩니다.

`pnpm dev`는 제품 소개, 문서, 이미지와 파일의 변경을 감지합니다. 문서 주소에 마지막 `/` 없이 접근하면 `/`가 붙은 주소로 이동합니다.

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
