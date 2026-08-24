# Quy tắc logic gõ tiếng Việt Telex

Tài liệu này mô tả logic gõ tiếng Việt đang được áp dụng trong website Gõ Mười Ngón. Agent có thể dùng tài liệu này để triển khai lại phần xử lý tiếng Việt mà không phụ thuộc vào giao diện hiện tại.

## 1. Phạm vi

- Bộ gõ: Telex.
- Bàn phím vật lý: QWERTY.
- Chuỗi bài học được lưu dưới dạng chữ tiếng Việt đã hiển thị, ví dụ: `ă â ơ ư`.
- Người dùng nhập bằng phím Telex, ví dụ:
  - `aw` tạo `ă`.
  - `aa` tạo `â`.
  - `ow` tạo `ơ`.
  - `uw` tạo `ư`.
  - `dd` tạo `đ`.
- Logic phải hỗ trợ nhập trực tiếp bằng IME, dán văn bản và gõ từng phím vật lý.

## 2. Chuẩn hóa Unicode

Luôn chuẩn hóa chuỗi mục tiêu và chuỗi người dùng nhập:

```js
const normalized = value => (value || '').normalize('NFC');
```

- `NFC` dùng để so sánh ký tự hiển thị như `ấ`, `ệ`, `ư`.
- Khi phân tích cấu tạo một ký tự tiếng Việt, chuyển ký tự sang `NFD` để tách chữ cái gốc và dấu kết hợp.

Ví dụ:

```js
const composed = 'ấ'.normalize('NFC');
const decomposed = composed.normalize('NFD');
// a + dấu mũ + dấu sắc
```

## 3. Bảng ánh xạ dấu thanh

Dấu Unicode phải được đổi thành phím Telex như sau:

| Dấu | Unicode combining mark | Phím Telex | Ví dụ |
|---|---|---|---|
| Sắc | `\u0301` | `s` | `á` |
| Huyền | `\u0300` | `f` | `à` |
| Hỏi | `\u0309` | `r` | `ả` |
| Ngã | `\u0303` | `x` | `ã` |
| Nặng | `\u0323` | `j` | `ạ` |

Phím `z` không phải là một phần bắt buộc khi sinh chuỗi mục tiêu. Có thể dùng `z` trong phần hướng dẫn để biểu thị thao tác bỏ dấu.

```js
const toneKeys = {
  '\u0301': 's',
  '\u0300': 'f',
  '\u0309': 'r',
  '\u0303': 'x',
  '\u0323': 'j'
};
```

## 4. Bảng ánh xạ nguyên âm Telex

| Ký tự tiếng Việt | Chuỗi phím |
|---|---|
| `ă` | `aw` |
| `â` | `aa` |
| `ê` | `ee` |
| `ô` | `oo` |
| `ơ` | `ow` |
| `ư` | `uw` |
| `đ` | `dd` |

Quy tắc tổng quát:

1. Gõ chữ cái gốc.
2. Nếu có dấu breve `\u0306`, thêm `w` (`ă`).
3. Nếu có dấu mũ `\u0302`, lặp lại chữ cái gốc (`â`, `ê`, `ô`).
4. Nếu có dấu móc `\u031B`, thêm `w` (`ơ`, `ư`).
5. Sau đó thêm phím dấu thanh tương ứng.

Ví dụ:

| Ký tự | Phân tích | Chuỗi phím |
|---|---|---|
| `ă` | `a + breve` | `aw` |
| `ắ` | `a + breve + sắc` | `aws` |
| `ầ` | `a + mũ + huyền` | `aaf` |
| `ộ` | `o + mũ + nặng` | `ooj` |
| `ớ` | `o + móc + sắc` | `ows` |
| `ự` | `u + móc + nặng` | `uwj` |
| `đ` | ký tự đặc biệt | `dd` |

## 5. Hàm chuyển một ký tự thành chuỗi phím

Pseudo-code tương đương logic hiện tại:

```js
function telexKeysForChar(char) {
  if (!char) return [];
  if (char === ' ') return ['space'];

  // đ cần hai phím d, không dùng alias đ -> d ở nhánh này.
  if (char.toLowerCase() === 'đ') return ['d', 'd'];

  const alias = aliases[char] || char;
  const decomposed = alias.toLowerCase().normalize('NFD');
  const base = removeCombiningMarks(decomposed);
  const keys = base ? [base[0]] : [];

  const marks = [...decomposed.slice(1)];
  if (marks.includes('\u0306')) keys.push('w');
  if (marks.includes('\u0302')) keys.push(base[0]);
  if (marks.includes('\u031B')) keys.push('w');

  for (const mark of marks) {
    if (toneKeys[mark]) keys.push(toneKeys[mark]);
  }
  return keys;
}
```

Lưu ý: thứ tự dấu trong Unicode có thể khác nhau giữa các nguồn dữ liệu. Nên dùng `NFD`, lấy chữ cái đầu tiên làm base, xử lý hình dạng nguyên âm trước rồi mới thêm dấu thanh.

## 6. Alias ký tự bàn phím

Dùng alias để quy đổi các ký tự không có phím riêng hoặc ký tự cần phím tương đương:

```js
const aliases = {
  'đ': 'd',
  'Đ': 'd',
  ':': ';',
  '"': "'",
  '?': '/',
  '_': '-',
  '+': '=',
  '*': '8',
  '<': ',',
  '>': '.'
};
```

Alias này dùng cho nhận diện phím vật lý thông thường. Riêng hàm Telex phải xử lý `đ` trước alias để bảo đảm `đ = dd`.

## 7. Xây dựng chuỗi mục tiêu vật lý

Chuỗi bài học là chuỗi chữ hiển thị, ví dụ:

```text
ă â ơ ư
```

Không được dùng trực tiếp chuỗi hiển thị để xác định phím kế tiếp. Phải chuyển từng ký tự sang chuỗi phím:

```js
const targetKeys = [...normalizedTarget()]
  .flatMap(char => lang === 'vi'
    ? telexKeysForChar(char)
    : [keyForChar(char)]
  );
```

Ví dụ:

```text
Mục tiêu hiển thị: ă â
Chuỗi phím vật lý: a w space a a
```

## 8. So sánh tiến độ hiển thị và tiến độ vật lý

Phải quản lý hai loại tiến độ riêng:

1. `typedChars`: ký tự đang hiển thị trong ô nhập.
2. `typedKeys`: các phím vật lý đã ghi nhận.

Lý do: IME hoặc trình duyệt có thể biến nhiều phím Telex thành một ký tự Unicode. Ví dụ `a` + `w` có thể hiển thị thành `ă`.

Quy trình:

```js
const typedChars = [...normalizedInput()];
const targetChars = [...normalizedTarget()];

let completedChars = 0;
while (
  completedChars < typedChars.length &&
  completedChars < targetChars.length &&
  samePhysicalChar(typedChars[completedChars], targetChars[completedChars])
) {
  completedChars++;
}
```

`samePhysicalChar` cần so sánh NFC và không phân biệt hoa/thường:

```js
function samePhysicalChar(a, b) {
  const left = (a || '').normalize('NFC');
  const right = (b || '').normalize('NFC');
  return left === right || left.toLocaleLowerCase() === right.toLocaleLowerCase();
}
```

Sau đó lấy các phím Telex tương ứng với những ký tự đã hoàn tất và ký tự đang gõ dở. Không được reset tiến độ nếu người dùng chỉ đang nhập một phần hợp lệ của ký tự Telex.

## 9. Ghi nhận phím và phím kế tiếp

Khi `keydown`:

1. Bỏ qua các phím điều khiển không tạo ký tự, ngoại trừ `Backspace`.
2. `Tab` phải được chặn để không rời ô nhập.
3. Chuyển `event.key` thành phím vật lý bằng `keyForChar`.
4. So sánh với `targetKeys[typedKeys.length]`.
5. Ghi phím vào `typedKeys`.
6. Nếu sai, ghi vị trí vào `physicalErrors`.

Pseudo-code:

```js
function handleKeydown(event) {
  if (event.key === 'Tab') {
    event.preventDefault();
    return;
  }

  if (event.key === 'Backspace') {
    typedKeys.pop();
    physicalErrors.delete(typedKeys.length);
    return;
  }

  if (event.key.length !== 1) return;

  const actualKey = keyForChar(event.key);
  const expectedKey = targetKeys[typedKeys.length] || '';
  const position = typedKeys.length;

  typedKeys.push(actualKey);
  if (actualKey !== expectedKey) physicalErrors.add(position);
}
```

## 10. Hỗ trợ IME và dán văn bản

Phải lắng nghe:

```js
compositionstart
compositionend
input
```

Khi `compositionend`, chờ một task/event loop để trình duyệt cập nhật đầy đủ giá trị ô nhập rồi chạy lại logic `input`.

```js
input.addEventListener('compositionend', () => {
  setTimeout(() => {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }, 0);
});
```

Nếu người dùng dán cả đoạn văn bản trước khi có `typedKeys`, có thể sinh tạm `typedKeys` từ từng ký tự hiển thị bằng `telexKeysForChar` để cập nhật tiến độ và độ chính xác.

## 11. Điều kiện hoàn thành bài

Bài hoàn thành khi đồng thời thỏa mãn:

```js
normalizedInput() === normalizedTarget()
&& typedKeys.length >= targetKeys.length
```

Khi hoàn thành:

- Dừng timer.
- Khóa ô nhập.
- Tính WPM và độ chính xác.
- Hiển thị modal kết quả.
- Ở chế độ học 10 ngón, đánh dấu lesson hoàn thành nếu độ chính xác từ 70% trở lên.
- Nút kết quả là `Tiếp tục` ở chế độ học 10 ngón.
- Nút kết quả là `Chơi lại` ở chế độ luyện tự do.

## 12. Tính độ chính xác

Độ chính xác hiện tại dựa trên số phím vật lý:

```js
const correctKeys = typedKeys.length - physicalErrors.size;
const accuracy = typedKeys.length
  ? Math.max(0, Math.round(correctKeys / typedKeys.length * 100))
  : 100;
```

Không tính riêng theo số ký tự Unicode vì một ký tự có dấu có thể cần nhiều phím Telex.

## 13. Hiển thị hướng dẫn cho người dùng

Bảng hướng dẫn phải dùng chữ tiếng Việt thật, không chỉ hiển thị chuỗi phím:

```text
Nguyên âm:
aa = â
aw = ă
ee = ê
oo = ô
ow = ơ
uw = ư
dd = đ

Dấu thanh:
s = sắc
f = huyền
r = hỏi
x = ngã
j = nặng
```

Bài mẫu nên hiển thị ký tự đích, ví dụ:

```text
ă â
ê ô
ơ ư
á à ả ã ạ
```

Người dùng nhập chuỗi Telex tương ứng, nhưng nhìn thấy chữ tiếng Việt hoàn chỉnh trong prompt.

## 14. Bộ test bắt buộc

Agent triển khai lại phải kiểm tra tối thiểu:

| Mục tiêu | Phím nhập đúng |
|---|---|
| `ă` | `aw` |
| `â` | `aa` |
| `ê` | `ee` |
| `ô` | `oo` |
| `ơ` | `ow` |
| `ư` | `uw` |
| `đ` | `dd` |
| `á` | `as` |
| `ầ` | `aaf` |
| `ậ` | `aaj` |
| `ớ` | `ows` |
| `ự` | `uwj` |
| khoảng trắng | `Space` |

Ngoài ra phải test:

- Nhập sai một phím rồi sửa bằng Backspace.
- Nhập bằng IME.
- Dán văn bản có dấu.
- Nhập chữ hoa.
- Chuyển bài giữa tiếng Việt và tiếng Anh.
- Ký tự `đ` không bị xử lý thành một phím `d` duy nhất.

## 15. Nguyên tắc không được vi phạm

- Không so sánh trực tiếp chuỗi phím `aa` với chữ hiển thị `â`.
- Không dùng alias `đ -> d` trước khi xử lý quy tắc đặc biệt `đ -> dd`.
- Không bỏ qua chuẩn hóa Unicode.
- Không dùng số ký tự hiển thị để tính số phím Telex.
- Không khóa bài chỉ vì người dùng đang ở giữa một chuỗi Telex hợp lệ.
- Không hiển thị `aa`, `aw`, `ow`, `uw` như nội dung bài chính mà không giải thích chúng tạo ra chữ gì.
