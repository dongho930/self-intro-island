/*
 * 방명록 연결 설정
 * 비워 두면 "미리보기 모드"로 동작합니다. (방명록이 지금 보고 있는 브라우저에만 저장됨)
 * AppSync API를 만든 뒤 GraphQL 주소와 API 키를 넣으면 모든 방문자가 같은 방명록을 보게 됩니다.
 */
window.APP_CONFIG = {
  guestbook: {
    endpoint: '', // 예: https://xxxxxxxx.appsync-api.ap-northeast-2.amazonaws.com/graphql
    apiKey: '', // 예: da2-xxxxxxxxxxxxxxxxxxxxxxxxxx
  },
};
