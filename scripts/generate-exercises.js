const fs = require('fs');
const path = require('path');

const viThemes = {
  school: [
    'Buổi sáng, An đến lớp sớm và mở cửa giúp cô giáo.',
    'Lan xếp sách ngay ngắn rồi lau sạch chiếc bàn nhỏ.',
    'Minh cùng các bạn đọc bài bằng giọng rõ ràng.',
    'Cả lớp chăm chú nghe cô kể chuyện về lòng tốt.',
    'Giờ ra chơi, các bạn chia nhau quả bóng màu xanh.',
    'Mai nhắc bạn giữ trật tự khi đi qua hành lang.',
    'Nam viết từng dòng cẩn thận vào quyển vở mới.',
    'Các bạn cùng sửa lỗi và vui vẻ học điều hay.',
    'Cô giáo khen cả lớp biết giúp đỡ lẫn nhau.',
    'Mỗi nhóm hoàn thành bức tranh về ngôi trường xanh.',
    'Trước khi về, học sinh nhặt giấy quanh sân trường.',
    'Một ngày học vui giúp các bạn thêm yêu lớp học.'
  ],
  nature: [
    'Sáng nay, khu vườn nhỏ đón những tia nắng ấm.',
    'Chim sẻ chuyền cành và hót vang bên cửa sổ.',
    'An nhẹ tay tưới nước cho luống hoa trước nhà.',
    'Mai quan sát đàn bướm bay quanh khóm cúc vàng.',
    'Các bạn nhặt lá khô để lối đi luôn sạch đẹp.',
    'Một chú kiến nhỏ đang tha thức ăn về tổ.',
    'Gió dịu dàng làm hàng cây xanh rung rinh trước ngõ.',
    'Sau cơn mưa, cầu vồng hiện lên phía chân trời.',
    'Minh ghi lại tên các loài cây trong quyển sổ.',
    'Mọi người cùng chăm sóc để khu vườn luôn tươi tốt.',
    'Tiếng suối trong veo làm chuyến đi thêm vui vẻ.',
    'Yêu thiên nhiên bắt đầu từ những việc làm nhỏ.'
  ],
  family: [
    'Chiều nay, cả nhà cùng chuẩn bị một bữa cơm ngon.',
    'Bé Lan rửa rau còn anh Nam sắp bát đũa.',
    'Bố hướng dẫn Minh sửa lại chiếc kệ sách nhỏ.',
    'Mẹ vui vẻ kể chuyện khi mọi người ngồi bên nhau.',
    'An giúp bà tưới cây và quét sạch khoảng sân.',
    'Hai chị em chia nhau gấp quần áo thật ngay ngắn.',
    'Sau bữa tối, cả nhà cùng đọc một cuốn truyện.',
    'Ông dạy các cháu biết giữ lời hứa với mọi người.',
    'Mai luôn chào hỏi lễ phép khi có khách đến nhà.',
    'Mỗi người góp một việc nên căn phòng sớm gọn gàng.',
    'Tiếng cười ấm áp làm ngôi nhà thêm nhiều niềm vui.',
    'Sự quan tâm nhỏ bé giúp gia đình luôn gần gũi.'
  ],
  friendship: [
    'Giờ ra chơi, Hoa rủ Linh cùng nhảy dây ngoài sân.',
    'Thấy bạn quên bút, An liền cho bạn mượn một chiếc.',
    'Minh kiên nhẫn chỉ cho Nam cách giải bài toán.',
    'Các bạn lắng nghe khi một người đang kể chuyện.',
    'Mai chân thành xin lỗi vì đã vô ý làm bạn buồn.',
    'Cả nhóm cùng chia sẻ màu vẽ để hoàn thành bức tranh.',
    'Một lời động viên giúp Lan tự tin đọc bài hơn.',
    'Các bạn thống nhất chơi vui và luôn tuân theo luật.',
    'Khi có ý kiến khác nhau, mọi người bình tĩnh trao đổi.',
    'Tình bạn đẹp lớn lên từ sự chân thành và tử tế.',
    'Nam cảm ơn bạn đã chờ mình trước cổng trường.',
    'Mỗi bạn đều vui khi biết quan tâm đến người khác.'
  ],
  health: [
    'Mỗi sáng, Bình thức dậy sớm và tập vài động tác.',
    'Lan luôn rửa tay sạch trước khi ngồi vào bàn ăn.',
    'Các bạn uống đủ nước trong suốt một ngày học.',
    'Bữa trưa có rau xanh, trứng và một bát canh nóng.',
    'Minh ngồi thẳng lưng khi đọc sách dưới ánh đèn.',
    'Sau giờ học, cả nhóm chạy bộ quanh sân trường.',
    'Mai đánh răng cẩn thận vào buổi sáng và buổi tối.',
    'Một giấc ngủ đủ giúp cơ thể khỏe và học tốt.',
    'Các bạn chọn trái cây thay cho quá nhiều bánh ngọt.',
    'Khi thấy mệt, An nghỉ ngơi và báo cho người lớn.',
    'Thói quen tốt cần được thực hiện đều đặn mỗi ngày.',
    'Giữ cơ thể sạch sẽ giúp mọi người luôn vui khỏe.'
  ],
  reading: [
    'Cuối tuần, Vy chọn một cuốn sách về các vì sao.',
    'Bạn nhỏ ngồi bên cửa sổ và đọc từng trang chậm rãi.',
    'Câu chuyện đưa các bạn đến một khu rừng kỳ diệu.',
    'Minh ghi những từ mới vào cuốn sổ màu xanh.',
    'Lan kể lại đoạn mình thích nhất cho em cùng nghe.',
    'Thư viện yên tĩnh có nhiều cuốn truyện rất thú vị.',
    'Cô hướng dẫn cả lớp giữ sách sạch và không gấp mép.',
    'Mỗi trang sách mở ra một điều mới để khám phá.',
    'Các bạn thay nhau đoán kết thúc của câu chuyện.',
    'Đọc đều mỗi ngày giúp vốn từ ngày càng phong phú.',
    'An trả sách đúng chỗ trước khi chọn cuốn tiếp theo.',
    'Niềm vui đọc sách có thể chia sẻ với mọi người.'
  ]
};

const enThemes = {
  school: [
    'Anna arrives early and opens the classroom door for her teacher.',
    'Ben places every book neatly on the small wooden shelf.',
    'The class reads a short story in clear and steady voices.',
    'Mia listens carefully while her teacher explains a new lesson.',
    'At break time, the children share a bright blue ball.',
    'Noah reminds his friends to walk quietly in the hallway.',
    'Each student writes careful lines in a clean new notebook.',
    'The children correct their work and learn from every mistake.',
    'Their teacher praises the class for helping one another.',
    'Each group paints a cheerful picture of their green school.',
    'Before leaving, the students collect paper from the playground.',
    'A happy school day helps everyone enjoy learning together.'
  ],
  nature: [
    'Warm morning sunlight falls across the quiet little garden.',
    'Small birds hop between branches and sing beside the window.',
    'Liam gently waters the flowers near the front gate.',
    'Emma watches bright butterflies circle the yellow flowers.',
    'The children gather dry leaves and keep the path clean.',
    'A tiny ant carries a crumb back to its nest.',
    'A soft wind moves the green trees along the road.',
    'After the rain, a rainbow appears above the distant hills.',
    'Oliver writes the names of plants in his nature notebook.',
    'Everyone works together to keep the garden fresh and healthy.',
    'The clear stream makes the afternoon walk feel peaceful.',
    'Caring for nature begins with simple and thoughtful actions.'
  ],
  family: [
    'This evening, the whole family prepares a warm meal together.',
    'Lucy washes vegetables while her brother sets the table.',
    'Dad shows Ethan how to fix the small book shelf.',
    'Mom tells a funny story while everyone sits together.',
    'Sofia helps her grandmother water plants and sweep the yard.',
    'The two children fold clean clothes into neat little piles.',
    'After dinner, the family reads a new story together.',
    'Grandpa teaches the children to keep promises and speak kindly.',
    'Grace welcomes every visitor with a polite and friendly greeting.',
    'Each person completes one task, so the room becomes tidy.',
    'Warm laughter fills the home with comfort and happiness.',
    'Small acts of care help every family stay close.'
  ],
  friendship: [
    'During break, Lily invites Ava to jump rope outside.',
    'When Sam forgets a pencil, Jack lends him a spare.',
    'Ella patiently shows her friend how to solve the problem.',
    'The children listen closely when someone shares a story.',
    'Mia gives a sincere apology after hurting a friend by accident.',
    'The group shares crayons to finish a colorful picture.',
    'A few kind words help Leo read with more confidence.',
    'Everyone agrees to play fairly and follow the rules.',
    'When ideas differ, the friends speak calmly and listen carefully.',
    'Strong friendship grows through honesty, patience, and kindness.',
    'Henry thanks his friend for waiting beside the school gate.',
    'Every child feels happy when friends care for one another.'
  ],
  health: [
    'Every morning, Lucas wakes early and stretches his arms.',
    'Emily washes her hands before sitting down to eat.',
    'The students drink enough water throughout their busy school day.',
    'Lunch includes green vegetables, an egg, and warm soup.',
    'Daniel sits with a straight back while reading under the lamp.',
    'After class, the group runs slowly around the playground.',
    'Chloe brushes her teeth carefully each morning and evening.',
    'Enough sleep helps the body stay healthy and learn well.',
    'The children choose fresh fruit instead of too much candy.',
    'When he feels tired, Owen rests and tells an adult.',
    'Healthy habits become stronger through practice every single day.',
    'Keeping clean helps everyone feel comfortable, active, and cheerful.'
  ],
  reading: [
    'On Saturday, Ruby chooses a book about distant stars.',
    'She sits beside the window and reads each page slowly.',
    'The story carries the children into a magical green forest.',
    'James records every new word in a blue notebook.',
    'Olivia retells her favorite part to her younger brother.',
    'The quiet library holds many exciting books and gentle stories.',
    'Their teacher shows everyone how to keep each book clean.',
    'Every page offers a fresh idea waiting to be discovered.',
    'The children take turns guessing how the story will end.',
    'Daily reading builds a larger and more useful vocabulary.',
    'Mason returns one book before choosing another from the shelf.',
    'The joy of reading grows when stories are shared.'
  ]
};

const profiles = [
  { language: 'vi', level: 'easy', count: 167, sentenceCount: 2, minWords: 16, maxWords: 30, minAccented: 6 },
  { language: 'vi', level: 'medium', count: 167, sentenceCount: 3, minWords: 27, maxWords: 47, minAccented: 12 },
  { language: 'vi', level: 'hard', count: 166, sentenceCount: 5, minWords: 45, maxWords: 76, minAccented: 22 },
  { language: 'en', level: 'easy', count: 167, sentenceCount: 2, minWords: 16, maxWords: 30, minAccented: 0 },
  { language: 'en', level: 'medium', count: 167, sentenceCount: 3, minWords: 27, maxWords: 47, minAccented: 0 },
  { language: 'en', level: 'hard', count: 166, sentenceCount: 5, minWords: 45, maxWords: 76, minAccented: 0 }
];

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

function shuffle(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function wordsOf(text) {
  return text.match(/[\p{L}]+/gu) || [];
}

function hasVietnameseMark(word) {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu.test(word);
}

function analyze(text) {
  const words = wordsOf(text);
  const accentedWordCount = words.filter(hasVietnameseMark).length;
  return {
    wordCount: words.length,
    accentedWordCount,
    accentRatio: words.length ? Number((accentedWordCount / words.length).toFixed(3)) : 0
  };
}

function makeParagraph(themePool, sentenceCount, random) {
  return shuffle(themePool, random).slice(0, sentenceCount).join(' ');
}

function buildProfile(profile, usedTexts) {
  const source = profile.language === 'vi' ? viThemes : enThemes;
  const themes = Object.keys(source);
  const results = [];

  for (let index = 0; index < profile.count; index += 1) {
    let record;
    for (let attempt = 0; attempt < 500; attempt += 1) {
      const seed = 20260812 + index * 7919 + attempt * 104729 + profile.sentenceCount * 101 + (profile.language === 'vi' ? 17 : 43);
      const random = mulberry32(seed);
      const theme = themes[Math.floor(random() * themes.length)];
      const text = makeParagraph(source[theme], profile.sentenceCount, random);
      const stats = analyze(text);
      const validLength = stats.wordCount >= profile.minWords && stats.wordCount <= profile.maxWords;
      const validAccents = profile.language === 'en' || stats.accentedWordCount >= profile.minAccented;

      if (!usedTexts.has(text) && validLength && validAccents) {
        record = { theme, text, ...stats };
        break;
      }
    }

    if (!record) {
      throw new Error(`Cannot generate unique ${profile.language}/${profile.level} record ${index + 1}`);
    }

    usedTexts.add(record.text);
    results.push({
      id: `${profile.language}-${profile.level}-${String(index + 1).padStart(3, '0')}`,
      language: profile.language,
      level: profile.level,
      ...record
    });
  }

  return results;
}

const usedTexts = new Set();
const exercises = profiles.flatMap((profile) => buildProfile(profile, usedTexts));
const distribution = profiles.reduce((result, profile) => {
  result[profile.language] ||= {};
  result[profile.language][profile.level] = profile.count;
  return result;
}, {});

if (exercises.length !== 1000 || usedTexts.size !== 1000) {
  throw new Error(`Expected 1000 unique exercises, received ${exercises.length}/${usedTexts.size}`);
}

const payload = {
  version: 1,
  total: exercises.length,
  distribution,
  exercises
};

const outputDir = path.join(__dirname, '..', 'data');
const outputFile = path.join(outputDir, 'exercises.json');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

console.log(`Created ${outputFile} with ${exercises.length} unique exercises.`);
