// lib/luckyEngine.ts

export const HEXAGRAMS = [
  { name: "건(乾)", sym: "☰", quote: "하늘은 스스로 돕는 자를 돕는다.", src: "주역 1괘 건(乾)" },
  { name: "곤(坤)", sym: "☷", quote: "부드러움이 결국 강함을 이긴다.", src: "주역 2괘 곤(坤)" },
  { name: "수(需)", sym: "☵", quote: "때를 기다리는 자에게 기회가 온다.", src: "주역 5괘 수(需)" },
  { name: "태(泰)", sym: "☱", quote: "작은 것이 가고 큰 것이 온다.", src: "주역 11괘 태(泰)" },
  { name: "겸(謙)", sym: "☳", quote: "낮은 곳에 물이 모이듯, 겸손에 복이 모인다.", src: "주역 15괘 겸(謙)" },
  { name: "복(復)", sym: "☴", quote: "반드시 돌아온다. 빛은 어둠 뒤에 있다.", src: "주역 24괘 복(復)" },
  { name: "항(恒)", sym: "☲", quote: "한결같음이 결국 모든 것을 얻게 한다.", src: "주역 32괘 항(恒)" },
  { name: "익(益)", sym: "☱", quote: "나누면 더 커지고, 베풀면 더 풍요로워진다.", src: "주역 42괘 익(益)" },
  { name: "정(井)", sym: "☵", quote: "우물은 마르지 않는다. 당신의 근원도 그러하다.", src: "주역 48괘 정(井)" },
  { name: "혁(革)", sym: "☰", quote: "변화를 두려워 말라. 그것이 곧 성장이다.", src: "주역 49괘 혁(革)" },
];

export type Hexagram = typeof HEXAGRAMS[number];

export function icShuffle(pool: number[], seed: number): number[] {
  const arr = [...pool];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function makeSeed(fixed: Set<number>): number {
  let s = Date.now() % 100000;
  fixed.forEach((n) => (s = s * 31 + n));
  return s | 0;
}

export function ballColor(n: number): string {
  if (n <= 10) return "ball-y";
  if (n <= 20) return "ball-b";
  if (n <= 30) return "ball-r";
  if (n <= 40) return "ball-s";
  return "ball-g";
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) if (n % i === 0) return false;
  return true;
}

export function analyzeFixed(nums: number[]): string {
  if (!nums.length) return "자신만의 행운의 숫자가 있다면 구슬을 눌러 고정하세요.";
  const sorted = [...nums].sort((a, b) => a - b);
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  const isSeq = nums.length > 1 && sorted.every((v, i, a) => i === 0 || v === a[i - 1] + 1);
  const allPrime = nums.every(isPrime);
  if (isSeq && nums.length >= 2) return "흐르는 연속의 기운, 막힘없이 나아갑니다.";
  if (allPrime && nums.length >= 2) return "소수(素數)만의 선택, 단단하고 순수한 의지입니다.";
  if (avg <= 15) return "차분하고 안정적인 에너지입니다. 신중함이 행운을 부릅니다.";
  if (avg >= 31) return "강한 기운의 숫자들, 큰 흐름이 당신 편입니다.";
  if (nums.some((n) => n <= 22) && nums.some((n) => n >= 23)) return "음양이 어우러진 조화로운 배치입니다.";
  return "균형 잡힌 숫자의 구성, 조화로운 기운이 느껴집니다.";
}

export function drawNumbers(fixed: Set<number>): { result: number[]; hexagram: Hexagram } {
  const seed = makeSeed(fixed);
  const pool: number[] = [];
  for (let i = 1; i <= 45; i++) if (!fixed.has(i)) pool.push(i);
  const shuffled = icShuffle(pool, seed);
  const randoms = shuffled.slice(0, 6 - fixed.size);
  const result = [...fixed, ...randoms];
  const hexagram = HEXAGRAMS[Math.abs(seed) % HEXAGRAMS.length];
  return { result, hexagram };
}
