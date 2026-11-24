# AWS 배포 가이드: S3 + CloudFront (OAC)

이번 주 과제 순서대로 정리했습니다. 위에서부터 차례로 따라 하면 됩니다.

**전체 흐름**

```
방문자 ──https──▶ CloudFront (dxxxx.cloudfront.net) ──OAC 서명 요청──▶ S3 버킷 (비공개)
방문자 ──────────────────────────────────────────────── S3 직접 접근 ──▶ AccessDenied
```

S3 버킷은 끝까지 비공개로 둡니다. 버킷 정책으로 **내 CloudFront 배포만** 파일을 읽을 수 있게 허용하는 구조입니다.

---

## 0. 시작 전에

**리전**
- 콘솔 오른쪽 위 리전을 **아시아 태평양(서울) ap-northeast-2**로 먼저 바꿉니다.
- 수업에서 받은 계정이 AWS Academy Learner Lab이면 서울 리전이 막혀 있을 수 있습니다. 그때는 `us-east-1`을 쓰고, 아래 S3 주소의 `ap-northeast-2`도 `us-east-1`로 바꿔 읽으세요.

**버킷 이름 미리 정하기**
- 전 세계에서 하나뿐이어야 합니다. 소문자, 숫자, 하이픈(-)만 쓰고 점(.)은 쓰지 않는 것이 좋습니다.
- 예: `self-intro-island-` 뒤에 본인만의 숫자나 영문을 붙이기.
- 이름은 만든 뒤 바꿀 수 없습니다. S3 직접 주소에 그대로 보이니 학번 같은 개인 정보는 넣지 마세요.

**비용**
- 이 사이트는 파일 17개, 모두 합쳐 1MB가 안 되어 S3 요금은 사실상 0원입니다.
- CloudFront에도 매달 무료 사용량이 있습니다.
- 돈이 나갈 수 있는 곳은 **AWS WAF(보안 보호)** 하나입니다. 3단계에서 켜지 않도록 안내합니다.

**올리기 전에 (선택)**
- `js/content.js`의 `[대괄호]`를 먼저 채우면 처음부터 완성된 화면으로 캡처할 수 있습니다.
- 나중에 채워도 6단계 방법으로 다시 올리면 됩니다.

---

## 1. S3 버킷 만들기

1. **S3** 콘솔을 엽니다.
2. **버킷 만들기**(Create bucket)를 누릅니다.
3. 아래처럼 설정합니다.

| 항목 | 설정 |
|---|---|
| 버킷 유형 | **범용**(General purpose) |
| 버킷 네임스페이스 | **글로벌**(Global, 기본값). 계정 리전 네임스페이스를 고르면 이름 뒤에 계정 ID와 리전이 자동으로 붙어 길어집니다 |
| 버킷 이름 | 0단계에서 정한 이름 |
| 객체 소유권 | **ACL 비활성화됨(권장)** 그대로 (OAC가 이 설정을 필요로 합니다) |
| 이 버킷의 퍼블릭 액세스 차단 설정 | **모든 퍼블릭 액세스 차단** 체크 그대로 ⬅ 과제 핵심 |
| 버킷 버전 관리 | 비활성화 (기본값) |
| 기본 암호화 | SSE-S3 (기본값) |

4. 맨 아래 **버킷 만들기**를 누릅니다.

> 버킷의 **정적 웹 사이트 호스팅**은 켜지 마세요. 웹 사이트 엔드포인트는 OAC와 함께 쓸 수 없고, 켜면 버킷을 공개해야 해서 과제 요구와 반대가 됩니다.

---

## 2. 사이트 파일 올리기

1. 만든 버킷 이름을 눌러 들어가서 **업로드**(Upload)를 누릅니다.
2. 파일 탐색기에서 프로젝트 폴더의 아래 **네 개만** 선택해 업로드 화면에 끌어다 놓습니다.
   - `index.html`
   - `css` 폴더
   - `js` 폴더
   - `images` 폴더

   끌어다 놓기가 안 되면 **파일 추가**로 `index.html`을, **폴더 추가**로 `css`, `js`, `images`를 하나씩 넣습니다.
3. **업로드**를 누릅니다.

**올리지 않을 것**
- 기획서(.docx)
- `README.md`
- `.gitignore`
- `.claude` 폴더
- `docs` 폴더

**올린 뒤 확인**
- 버킷 맨 위에 `index.html`, `css/`, `js/`, `images/`가 바로 보여야 합니다.
- 프로젝트 폴더 자체를 올리면 경로가 `자기소개웹앱/index.html`처럼 한 단계 깊어집니다. 그러면 사이트가 열리지 않으니 지우고 다시 올리세요.
- `css/`에는 `style.css` 1개가 있어야 합니다.
- `js/`에는 7개(`art`, `config`, `content`, `game`, `guestbook`, `ui`, `world`.js)가 있어야 합니다.
- `images/`에는 8개(`portrait.png`, `og.png`, `place-` 로 시작하는 장면 그림 6개)가 있어야 합니다.
- 파일 형식(Content-Type)은 콘솔이 확장자를 보고 자동으로 넣어 줍니다. 따로 설정하지 않아도 됩니다.

---

## 3. CloudFront 배포 만들기

CloudFront는 리전이 없는 글로벌 서비스입니다. 오른쪽 위 리전이 "글로벌"로 바뀌어도 정상입니다.

1. **CloudFront** 콘솔에서 **배포 생성**(Create distribution)을 누릅니다.
2. **요금제 선택 화면이 먼저 나오면** 아래처럼 고릅니다.
   - 무료(Free) 플랜이 보이면 그것을 고릅니다.
   - 아니면 종량제(Pay as you go)를 고릅니다.
   - 이 사이트 규모면 어느 쪽이든 요금이 거의 없습니다. 이 화면이 없으면 다음 단계로 넘어가면 됩니다.
3. 첫 화면에서는 아래처럼 입력합니다.
   - **Distribution name**: `self-intro-island`
   - 배포 유형: **Single website or app**
   - **Next**를 누릅니다.
4. **도메인 설정**(Domain)은 비워 두고 **Next**를 누릅니다. 개인 도메인이 없어도 됩니다.
5. **Specify origin**(원본 지정) 화면에서는 아래처럼 설정합니다.
   - Origin type: **Amazon S3**
   - Origin: **Browse S3**를 눌러 1단계에서 만든 버킷을 고릅니다.
   - Origin path: 비워 둡니다.
   - Settings: **Use recommended origin settings**(권장 원본 설정 사용)를 고릅니다. 이 설정이 **OAC를 자동으로 만들어 연결합니다.**
   - 비공개 버킷 접근 허용과 관련된 체크 항목이 보이면 켜 둔 상태로 둡니다.
   - **Next**를 누릅니다.
6. **Enable security protections**(보안 보호) 화면에서는 **Do not enable security protections**(사용 안 함)를 고르고 **Next**를 누릅니다. WAF는 켜면 요금이 나옵니다.
7. 검토 화면을 확인하고 **Create distribution**을 누릅니다.
   - 이때 CloudFront가 S3 버킷 정책을 자동으로 넣어 줍니다. 4단계에서 확인합니다.

### 기본 루트 객체 설정 (꼭 확인)

이 값이 비어 있으면 `https://dxxxx.cloudfront.net/`처럼 주소만 쳤을 때 AccessDenied가 나옵니다.

1. 만든 배포를 누른 뒤 **일반**(General) 탭으로 갑니다.
2. **설정**(Settings) 칸의 **편집**(Edit)을 누릅니다.
3. **기본 루트 객체**(Default root object)에 `index.html`을 입력합니다. 앞에 `/`는 붙이지 않습니다.
4. **변경 사항 저장**(Save changes)을 누릅니다.

### 배포 완료 기다리기

- 배포 목록의 **Last modified**(마지막 수정)가 `Deploying`에서 날짜와 시간으로 바뀌면 완료입니다. 보통 몇 분 걸립니다.
- 배포 상세 화면의 **배포 도메인 이름**(Distribution domain name)이 `d로 시작하는영문숫자.cloudfront.net` 형태로 나옵니다.
- 이 주소 앞에 `https://`를 붙인 것이 **제출할 CloudFront URL**입니다.

<details>
<summary>화면이 위 설명과 다르게 생겼을 때 (예전 형식의 긴 한 페이지 양식)</summary>

1. **원본 도메인**(Origin domain)에서 내 버킷(`버킷이름.s3.ap-northeast-2.amazonaws.com`)을 고릅니다.
2. **원본 액세스**(Origin access)는 **원본 액세스 제어 설정(권장)**(Origin access control settings)을 고릅니다.
3. **제어 설정 생성**(Create new OAC)을 눌러 기본값 그대로(**Sign requests**) 만듭니다.
4. **뷰어 프로토콜 정책**은 **Redirect HTTP to HTTPS**로 둡니다.
5. **웹 애플리케이션 방화벽(WAF)**은 **보안 보호 비활성화**를 고릅니다.
6. **기본 루트 객체**에 `index.html`을 입력합니다.
7. **배포 생성**을 누릅니다.
8. 생성 직후 위쪽에 "S3 버킷 정책을 업데이트해야 합니다"라는 안내와 **정책 복사**(Copy policy) 버튼이 나옵니다. 복사한 정책을 4단계 방법으로 S3에 붙여 넣으세요.

</details>

---

## 4. 버킷 정책 확인 (OAC 연결의 마지막 단계)

1. S3에서 내 버킷을 열고 **권한**(Permissions) 탭으로 갑니다.
2. **버킷 정책**(Bucket policy) 칸을 봅니다.
3. 아래와 비슷한 JSON이 이미 들어 있으면 끝입니다.
4. **비어 있으면** 아래처럼 직접 넣습니다.
   1. **편집**을 누릅니다.
   2. 아래 JSON을 붙여 넣고 대문자 자리 세 곳을 바꿉니다.
   3. **변경 사항 저장**을 누릅니다.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipalReadOnly",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT-ID:distribution/DISTRIBUTION-ID"
        }
      }
    }
  ]
}
```

| 바꿀 곳 | 어디서 찾나 |
|---|---|
| `YOUR-BUCKET-NAME` | 1단계에서 만든 버킷 이름 |
| `ACCOUNT-ID` | 콘솔 오른쪽 위 계정 메뉴의 12자리 숫자 (하이픈 없이) |
| `DISTRIBUTION-ID` | CloudFront 배포 목록의 **ID** 열 (E로 시작) |

**정책 뜻 (발표나 보고서에 쓸 수 있게)**
- `Principal`: CloudFront 서비스에게만 권한을 줍니다.
- `Action`: 파일 읽기(`GetObject`)만 허용합니다. 쓰기, 삭제, 목록 보기는 허용하지 않습니다.
- `Condition`의 `AWS:SourceArn`: CloudFront 중에서도 **내 배포 하나**에서 온 요청만 허용합니다. 다른 사람이 만든 CloudFront 배포로는 내 버킷을 읽을 수 없습니다.

### OAC가 연결됐는지 확인하는 곳

- **CloudFront 왼쪽 메뉴 › 원본 액세스**(Origin access): 자동으로 만들어진 OAC가 목록에 보입니다. 서명 동작은 "항상 서명", 원본 유형은 S3입니다.
- **배포 › 원본**(Origins) 탭 › S3 원본 선택 › **편집**: **원본 액세스** 칸에 위 OAC가 선택되어 있습니다.

---

## 5. 동작 확인

| 확인 | 주소 | 기대 결과 |
|---|---|---|
| CloudFront 접속 | `https://dxxxx.cloudfront.net` | 섬마을 시작 화면(승선권)이 뜨고 게임이 됩니다 |
| S3 직접 접속 | `https://YOUR-BUCKET-NAME.s3.ap-northeast-2.amazonaws.com/index.html` | XML 화면에 `<Code>AccessDenied</Code>` |

S3 직접 주소는 S3에서 `index.html`을 눌렀을 때 나오는 **객체 URL**을 그대로 열어도 됩니다. **열기** 버튼은 임시 서명 주소라서 열려 버리니 쓰지 마세요.

### 잘 안 될 때

| 증상 | 원인과 해결 |
|---|---|
| CloudFront 주소에서 AccessDenied | 아래 네 가지를 차례로 확인합니다: ① 기본 루트 객체가 비어 있음, ② 버킷 정책이 없거나 배포 ID가 틀림, ③ 아직 `Deploying` 중, ④ 파일이 폴더 안에 한 단계 더 들어가 있음 |
| 화면은 나오는데 글자만 있고 모양이 깨짐 | `css/`나 `js/` 폴더가 빠졌거나 위치가 다릅니다. 2단계 확인 목록을 다시 보세요 |
| S3 직접 주소가 열림 | 퍼블릭 액세스 차단이 꺼져 있거나 버킷 정책에 `"Principal": "*"`가 있습니다. 차단을 다시 켜고 정책을 위 JSON으로 바꾸세요 |
| 고친 내용이 반영 안 됨 | CloudFront 캐시 때문입니다. 6단계의 무효화를 하세요 |

---

## 6. 내용을 고친 뒤 다시 올릴 때

1. 바뀐 파일만 S3의 **같은 위치**에 다시 업로드합니다. 같은 이름이면 덮어씁니다.
   - 예: `content.js`를 고쳤다면 `js` 폴더 안으로 들어가서 업로드합니다.
2. CloudFront › 배포 › **무효화**(Invalidations) › **무효화 생성**을 누르고 경로에 `/*`를 넣어 만듭니다.
   - 1~2분 뒤 새 내용이 보입니다.
   - 무효화는 매달 경로 1,000개까지 무료입니다. `/*`는 1개로 셉니다.
3. GitHub에도 커밋하고 push해 두면 코드와 배포본이 같은 상태로 유지됩니다.

---

## 7. 제출용 캡처 목록

| 제출 항목 | 캡처할 화면 |
|---|---|
| 개발 환경: Claude Code | Claude Code에서 이 프로젝트를 열어 작업하는 화면 (저장소를 만들고 push한 대화가 보이면 좋음) |
| 개발 환경: GitHub | https://github.com/dongho930/self-intro-island 저장소 첫 화면 (파일 목록과 커밋) |
| 개발 환경: AWS | AWS 콘솔 홈 (오른쪽 위 리전 "서울"이 보이게) |
| CloudFront URL | 배포 상세 화면의 **배포 도메인 이름**과 그 주소로 열린 게임 화면 (URL을 글로도 적어 제출) |
| S3 퍼블릭 액세스 차단 | 버킷 › **권한** › **퍼블릭 액세스 차단(버킷 설정)**: "모든 퍼블릭 액세스 차단 › 켜짐" |
| OAC | CloudFront › **원본 액세스** 목록, 또는 배포 › **원본** › 편집 화면의 원본 액세스 칸 |
| 버킷 정책 | 버킷 › **권한** › **버킷 정책** JSON |
| 직접 접근 차단 확인 | S3 직접 주소의 `AccessDenied` XML 화면 (주소창이 보이게) |

> 계정 ID(12자리)는 비밀번호 같은 비밀 정보는 아니지만, 캡처에서 가리고 싶으면 가려도 됩니다.
> 다음 주 이후에는 이 배포 위에 방명록(AppSync + DynamoDB)을 붙이니, 과제가 끝나도 버킷과 배포는 지우지 마세요.
