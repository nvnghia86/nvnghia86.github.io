function randomIndex(limit) {
  if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * limit);
  const values = new Uint32Array(1);
  const ceiling = Math.floor(0x100000000 / limit) * limit;
  do { crypto.getRandomValues(values); } while (values[0] >= ceiling);
  return values[0] % limit;
}

export function shuffleStudents(students, index = randomIndex) {
  const result = [...students];
  for (let i = result.length - 1; i > 0; i--) {
    const j = index(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function pickStudents(students, count, called = [], noRepeat = true, index) {
  const seen = new Set(called);
  const available = students.filter(student => !noRepeat || !seen.has(student.studentId));
  return shuffleStudents(available, index).slice(0, Math.max(0, Math.min(available.length, Number(count) || 0)));
}

export function groupStudents(students, count, index) {
  const size = Math.min(students.length, Math.max(1, Math.floor(Number(count) || 1)));
  if (!size) return [];
  const groups = Array.from({ length: size }, () => []);
  shuffleStudents(students, index).forEach((student, i) => groups[i % size].push(student));
  return groups;
}
