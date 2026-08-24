export interface HeroCharacter {
  id: string;
  name: string;
  vietnameseTitle: string;
  role: 'Warrior' | 'Mage' | 'Archer' | 'Assassin' | 'Cyber' | 'Valkyrie';
  description: string;
  avatarEmoji: string;
  weaponName: string;
  skillName: string;
  skillDesc: string;
  primaryColor: string; // Tailwind color class or hex
  accentColor: string;
  badge: string;
}

export const HERO_CHARACTERS: HeroCharacter[] = [
  {
    id: 'warrior',
    name: 'Arthur of Light',
    vietnameseTitle: 'Hiệp Sĩ Thánh Kiếm',
    role: 'Warrior',
    description: 'Chiến binh mang giáp hộ mệnh với Thánh Kiếm Excalibur, chém tan bóng tối bằng những nhát kiếm công chính.',
    avatarEmoji: '⚔️',
    weaponName: 'Excalibur Holy Blade',
    skillName: 'Heavenly Blade Judgement (Thánh Kiếm Trảm)',
    skillDesc: 'Vung đại kiếm rực sáng, phóng luồng kiếm khí gây 250 DMG và nhận 80 Khiên hộ thể.',
    primaryColor: 'from-blue-600 to-indigo-700',
    accentColor: 'text-blue-600',
    badge: 'Holy Knight',
  },
  {
    id: 'mage',
    name: 'Eldrin the Starweaver',
    vietnameseTitle: 'Pháp Sư Nguyên Tố',
    role: 'Mage',
    description: 'Phù thủy thông thái điều khiển nguyên tố lửa, băng và sấm sét thông qua trượng phép Astral.',
    avatarEmoji: '🔮',
    weaponName: 'Astral Crystal Staff',
    skillName: 'Arcane Meteor Tempest (Bão Ma Pháp)',
    skillDesc: 'Tập trung năng lượng vũ trụ triệu hồi quả cầu sét khổng lồ thiêu đốt quái vật.',
    primaryColor: 'from-purple-600 to-violet-800',
    accentColor: 'text-purple-600',
    badge: 'Grand Magus',
  },
  {
    id: 'archer',
    name: 'Lyra Swiftwind',
    vietnameseTitle: 'Nữ Xạ Thủ Cung Gió',
    role: 'Archer',
    description: 'Thiện xạ tinh anh của rừng già, bắn tên xuyên tâm với vận tốc thần tốc không phát ra tiếng động.',
    avatarEmoji: '🏹',
    weaponName: 'Gale Wind Bow',
    skillName: 'Arrow Storm Volley (Mưa Tên Thần Tốc)',
    skillDesc: 'Bắn ra loạt mũi tên phong lôi xuyên thấu phòng thủ của bất kỳ quái vật nào.',
    primaryColor: 'from-emerald-600 to-teal-700',
    accentColor: 'text-emerald-600',
    badge: 'Wind Ranger',
  },
  {
    id: 'assassin',
    name: 'Kage the Shadow Blade',
    vietnameseTitle: 'Sát Thủ Bóng Đêm',
    role: 'Assassin',
    description: 'Bậc thầy ẩn thân trong bóng tối, tấn công chớp nhoáng với cặp song kiếm Ninjato sắc bén.',
    avatarEmoji: '🥷',
    weaponName: 'Dual Shadow Ninjato',
    skillName: 'Shadow Clone Slash (Phân Thân Trảm Sát)',
    skillDesc: 'Lướt xuyên không gian tung 9 nhát chém chí mạng trong một phần tích tắc.',
    primaryColor: 'from-slate-700 to-slate-900',
    accentColor: 'text-slate-700',
    badge: 'Shadow Master',
  },
  {
    id: 'cyber',
    name: 'Neo Plasma Striker',
    vietnameseTitle: 'Chiến Binh Laser Cyber',
    role: 'Cyber',
    description: 'Chiến binh tương lai mang giáp ngoại lực Exoskeleton cùng kiếm chùm năng lượng Plasma siêu thanh.',
    avatarEmoji: '⚡',
    weaponName: 'High-Freq Plasma Saber',
    skillName: 'Overdrive EMP Cannon (Pháo Xung Plasma)',
    skillDesc: 'Kích hoạt nạp năng lượng hạt nhân phóng chùm laser cực đại phá vỡ giáp quái vật.',
    primaryColor: 'from-cyan-500 to-blue-600',
    accentColor: 'text-cyan-600',
    badge: 'Cyber Ronin',
  },
  {
    id: 'valkyrie',
    name: 'Freya the Dawn Angel',
    vietnameseTitle: 'Nữ Thần Chiến Trận',
    role: 'Valkyrie',
    description: 'Thiên thần chiến trận mang đôi cánh ánh sáng, ban phước lành và thanh tẩy tà ma bằng ngọn thương thần thánh.',
    avatarEmoji: '✨',
    weaponName: 'Spear of Solar Dawn',
    skillName: 'Divine Solar Radiance (Hào Quang Thái Dương)',
    skillDesc: 'Hạ cánh từ thiên đường giáng tia sáng mặt trời hồi phục 200 HP và tiêu diệt hắc ám.',
    primaryColor: 'from-amber-500 to-yellow-600',
    accentColor: 'text-amber-600',
    badge: 'Dawn Valkyrie',
  },
];

export function getHeroById(id?: string): HeroCharacter {
  return HERO_CHARACTERS.find((h) => h.id === id) || HERO_CHARACTERS[0];
}

export const HEROES = HERO_CHARACTERS;

