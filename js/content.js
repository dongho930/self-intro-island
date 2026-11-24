/*
 * 사이트에 보이는 소개 내용은 모두 이 파일에 있습니다.
 * 내용을 바꾸고 저장하면 섬 전체에 반영됩니다.
 * 항목을 더 넣고 싶으면 { ... } 한 덩어리를 복사해서 쉼표(,)로 이어 붙이세요.
 */
window.SITE_CONTENT = {
  profile: {
    name: '장동호',
    job: '한양대학교 에리카 ICT융합학부',
    level: '2학년', // 한눈에 보기에서 "Lv. 2학년"처럼 보입니다
    tagline: '하고자 하는 일에 최선을 다하는 사람',
    greeting: '어서 오세요! 여기가 제 집이에요.',
    about: [
      '저는 하고자 하는 일에 최선을 다하는 사람이고, 요즘은 게임 개발에 빠져 있습니다.',
      '이 수업에서는 클라우드와 데이터베이스를 직접 다뤄 보며, 만든 것을 실제 서비스로 배포하고 운영하는 방법을 배우고 싶습니다. 게임에도 기록, 랭킹, 친구 목록처럼 데이터를 저장하고 꺼내 쓰는 부분이 꼭 필요하기 때문입니다. 지금 보고 계신 이 섬도 그 연습의 시작이고, 앞으로 방명록부터 하나씩 기능을 더해 가겠습니다.',
    ],
    facts: [
      { label: '전공', value: 'ICT융합학부' },
      { label: '관심 분야', value: '개발' },
      { label: '사는 곳', value: '전라남도 화순군' },
      { label: 'MBTI', value: 'INFJ' },
    ],
  },

  // 장소 창 맨 위에 집주인이 하는 말
  places: {
    library: { intro: '제가 배우고 익힌 것들을 모아 둔 곳이에요.' },
    workshop: { intro: '직접 만들어 본 것들이에요. 최신 작업부터 보여 드릴게요.' },
    lighthouse: { intro: '지금까지 걸어온 길과 앞으로 가고 싶은 곳이에요.' },
    pyeongsang: { intro: '쉬는 날엔 여기서 이런 걸 하며 지내요.' },
    mailbox: { intro: '궁금한 게 있으면 언제든 편지 주세요.' },
    board: { intro: '다녀가셨다면 한 줄 남겨 주세요. 모두 읽어 볼게요.' },
  },

  education: [
    { period: '2023 ~ 현재', school: '한양대학교 에리카', detail: 'ICT융합학부 2학년' },
  ],

  // level: 1~5 사이 숫자로 본인 수준에 맞게 고치세요
  skills: [
    { name: 'HTML / CSS', level: 3 },
    { name: 'JavaScript', level: 3 },
    { name: 'AWS (S3, CloudFront)', level: 3 },
    { name: '데이터베이스 (SQL, DynamoDB)', level: 3 },
    { name: 'Git / GitHub', level: 4 },
  ],

  certificates: [
    { name: 'ADsP (데이터분석 준전문가)', date: '2026' },
  ],

  courses: ['클라우드 데이터베이스', '데이터베이스', '컴퓨터 알고리즘', 'ICT창업캡스톤'],

  // date는 정렬용(최신순)입니다. YYYY-MM 형식으로 적어 주세요.
  projects: [
    {
      title: '자기소개 섬 웹앱',
      date: '2026-11',
      period: '2026.11 ~ 진행 중',
      role: '기획, 게임 화면 개발, AWS 배포',
      tech: ['HTML', 'CSS', 'JavaScript', 'Canvas', 'S3', 'CloudFront'],
      result: '작은 섬마을을 걸어 다니며 소개를 읽는 게임형 자기소개 사이트입니다.',
      links: [{ label: 'GitHub', url: 'https://github.com/dongho930/self-intro-island' }],
    },
  ],

  timeline: [
    { year: '2026', text: '클라우드 데이터베이스 수업에서 자기소개 섬 웹앱 제작' },
    { year: '2026', text: 'ADsP (데이터분석 준전문가) 취득' },
    { year: '2023', text: '한양대학교 에리카 ICT융합학부 입학' },
  ],

  goals: [
    '클라우드와 데이터베이스로 기록과 랭킹이 저장되는 온라인 게임 만들기',
    '직접 만든 게임을 실제 사람들이 플레이하는 서비스로 출시하기',
    '이 섬에 방명록을 연결해 방문자 모두가 함께 쓰는 공간으로 키우기',
  ],

  hobbies: [
    { name: '게임', desc: '즐기다 보면 어떻게 만들었는지 궁금해지는, 게임 개발의 출발점' },
    { name: '운동', desc: '몸을 움직이며 머리를 식히는 시간' },
    { name: '노래 감상', desc: '작업할 때도 쉴 때도 늘 함께하는 것' },
  ],

  contactNote: '수업 과제나 팀 프로젝트 이야기 모두 환영해요.',
  contacts: [
    { label: '이메일', value: 'zakuv2@naver.com', url: 'mailto:zakuv2@naver.com' },
    { label: 'GitHub', value: 'github.com/dongho930', url: 'https://github.com/dongho930' },
  ],

  // 섬에 처음 도착했을 때와 여섯 곳을 다 둘러봤을 때 하는 말
  messages: {
    intro: [
      '어서 오세요! 제 섬에 오신 걸 환영해요.',
      '섬 곳곳 여섯 군데에 제 이야기를 숨겨 두었어요. 한 곳을 둘러볼 때마다 스탬프가 하나씩 찍혀요.',
    ],
    controlsTouch: '가고 싶은 곳을 누르면 그곳까지 걸어가요. 건물을 누르면 바로 들어가 볼 수 있어요.',
    controlsKeyboard: '방향키나 WASD로 걷고, 장소 앞에서 Space를 누르면 안을 볼 수 있어요. 건물을 클릭해도 돼요.',
    complete: [
      '여섯 곳을 모두 둘러봤어요! 끝까지 와 주셔서 고마워요.',
      '광장의 마을 게시판에 방명록을 한 줄 남겨 주시면 정말 기쁠 거예요.',
    ],
  },
};
