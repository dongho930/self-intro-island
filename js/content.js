/*
 * 사이트에 보이는 소개 내용은 모두 이 파일에 있습니다.
 * [대괄호] 부분을 본인 내용으로 바꾸고 저장하면 섬 전체에 반영됩니다.
 * 항목을 더 넣고 싶으면 { ... } 한 덩어리를 복사해서 쉼표(,)로 이어 붙이세요.
 */
window.SITE_CONTENT = {
  profile: {
    name: '[이름]',
    job: '[직업: 예) 클라우드 개발자 지망생]',
    level: '[학년]', // 한눈에 보기에서 "Lv. 3학년"처럼 보입니다
    tagline: '[한 줄 소개: 예) 작은 것도 끝까지 만들어 보는 사람]',
    greeting: '어서 오세요! 여기가 제 집이에요.',
    about: [
      '[자기소개 첫 문단: 어떤 사람인지, 요즘 무엇에 빠져 있는지 적어 주세요.]',
      '[둘째 문단: 이 수업에서 배우고 싶은 것이나 함께하고 싶은 일을 적어 주세요.]',
    ],
    facts: [
      { label: '전공', value: '[학과]' },
      { label: '관심 분야', value: '[관심 분야]' },
      { label: '사는 곳', value: '[사는 곳]' },
      { label: 'MBTI', value: '[MBTI]' },
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
    { period: '[2023 ~ 현재]', school: '[대학교 이름]', detail: '[학과, 학년]' },
  ],

  // level: 1~5 사이 숫자로 본인 수준에 맞게 고치세요
  skills: [
    { name: 'HTML / CSS', level: 3 },
    { name: 'JavaScript', level: 3 },
    { name: 'AWS (S3, CloudFront)', level: 2 },
    { name: '데이터베이스 (SQL, DynamoDB)', level: 2 },
    { name: 'Git / GitHub', level: 2 },
  ],

  certificates: [
    { name: '[자격증 이름]', date: '[취득 연월]' },
  ],

  courses: ['클라우드 데이터베이스', '[수강 과목]', '[수강 과목]'],

  // date는 정렬용(최신순)입니다. YYYY-MM 형식으로 적어 주세요.
  projects: [
    {
      title: '자기소개 섬 웹앱',
      date: '2026-11',
      period: '2026.11 ~ 진행 중',
      role: '기획, 게임 화면 개발, AWS 배포',
      tech: ['HTML', 'CSS', 'JavaScript', 'Canvas', 'S3', 'CloudFront'],
      result: '작은 섬마을을 걸어 다니며 소개를 읽는 게임형 자기소개 사이트입니다.',
      links: [],
    },
    {
      title: '[프로젝트 이름]',
      date: '2026-06',
      period: '[2026.03 ~ 2026.06]',
      role: '[맡은 역할]',
      tech: ['[사용 기술]'],
      result: '[결과나 배운 점]',
      links: [{ label: 'GitHub', url: 'https://github.com/' }],
    },
  ],

  timeline: [
    { year: '2026', text: '클라우드 데이터베이스 수업에서 자기소개 섬 웹앱 제작' },
    { year: '[2023]', text: '[대학교 입학]' },
  ],

  goals: ['[앞으로의 목표 1]', '[앞으로의 목표 2]'],

  hobbies: [
    { name: '[취미 1]', desc: '[한 줄 설명]' },
    { name: '[취미 2]', desc: '[한 줄 설명]' },
    { name: '[취미 3]', desc: '[한 줄 설명]' },
  ],

  contactNote: '수업 과제나 팀 프로젝트 이야기 모두 환영해요.',
  contacts: [
    { label: '이메일', value: '[you@example.com]', url: 'mailto:you@example.com' },
    { label: 'GitHub', value: 'github.com/[아이디]', url: 'https://github.com/' },
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
