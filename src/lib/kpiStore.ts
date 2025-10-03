import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';

dayjs.extend(isoWeek);

type WeekSequence = { 
  weekKey: string; 
  daily: number[] 
}; // length 7

function getWeekKey(): string {
  const d = dayjs();
  return `${d.isoWeekYear()}-${String(d.isoWeek()).padStart(2, '0')}`;
}

function rng(seed: number): () => number {
  // simple LCG for stable pseudo-randoms
  let s = seed % 2147483647;
  return () => (s = (s * 48271) % 2147483647) / 2147483647;
}

function computeWeeklySequence(): WeekSequence {
  const weekKey = getWeekKey();
  const cached = localStorage.getItem(`completedWeek:${weekKey}`);
  if (cached) return JSON.parse(cached);

  const seedNum = parseInt(weekKey.replace(/\D/g, ''), 10);
  const rand = rng(seedNum);

  const target = 180 + Math.floor(rand() * 20); // 180..199 (never 200)
  const base = [6, 9, 12, 15, 18, 20, 25]; // shape; will scale

  // scale base to ~target with noise while keeping it increasing
  const sumBase = base.reduce((a, b) => a + b, 0);
  let scaled = base.map(v => Math.max(1, Math.round(v * target / sumBase)));

  // adjust total to match target, distributing ±1 while keeping non-decreasing
  let diff = target - scaled.reduce((a, b) => a + b, 0);
  while (diff !== 0) {
    const i = Math.floor(rand() * scaled.length);
    if (diff > 0) { 
      scaled[i] += 1; 
      diff--; 
    } else if (scaled[i] > 1) { 
      scaled[i] -= 1; 
      diff++; 
    }
  }

  // add small noise but keep >=1 and keep **cumulative** strictly increasing
  // we convert to cumulative after noise to enforce monotonicity
  let daily = scaled.map((v, i) => {
    const n = Math.round((rand() - 0.5) * 4); // -2..+2
    return Math.max(1, v + n);
  });

  // fix total again to stay != 200 and within 180..199
  let total = daily.reduce((a, b) => a + b, 0);
  if (total === 200) {
    // nudge one day by -1 or +1 to avoid 200, staying within bounds
    const i = Math.floor(rand() * daily.length);
    if (daily[i] > 1) daily[i] -= 1;
    else daily[(i + 1) % 7] += 1;
    total = daily.reduce((a, b) => a + b, 0);
  }
  if (total < 180) daily[daily.length - 1] += (180 - total);
  if (total > 199) daily[daily.length - 1] -= (total - 199);

  const seq = { weekKey, daily };
  localStorage.setItem(`completedWeek:${weekKey}`, JSON.stringify(seq));
  return seq;
}

export function getCompletedThisWeekCumulative(): number {
  const seq = computeWeeklySequence();
  const todayIdx = dayjs().isoWeekday() - 1; // 0..6 (Mon..Sun)
  return seq.daily.slice(0, todayIdx + 1).reduce((a, b) => a + b, 0);
}

// Daily persistent random KPIs
export function getDailyKPIs() {
  const today = dayjs().format('YYYY-MM-DD');
  
  // Challenges launched today (20-50)
  const launchedKey = `kpi_launched_${today}`;
  let challengesLaunchedToday = parseInt(localStorage.getItem(launchedKey) || '0');
  if (challengesLaunchedToday === 0) {
    challengesLaunchedToday = 20 + Math.floor(Math.random() * 31); // 20-50
    localStorage.setItem(launchedKey, challengesLaunchedToday.toString());
  }

  // Streaks continued today (50-150)
  const streaksKey = `kpi_streaks_${today}`;
  let streaksContinuedToday = parseInt(localStorage.getItem(streaksKey) || '0');
  if (streaksContinuedToday === 0) {
    streaksContinuedToday = 50 + Math.floor(Math.random() * 101); // 50-150
    localStorage.setItem(streaksKey, streaksContinuedToday.toString());
  }

  // Validation rate today (60-90%)
  const validationKey = `kpi_validation_${today}`;
  let validationRateToday = parseInt(localStorage.getItem(validationKey) || '0');
  if (validationRateToday === 0) {
    validationRateToday = 60 + Math.floor(Math.random() * 31); // 60-90
    localStorage.setItem(validationKey, validationRateToday.toString());
  }

  // Weekly progressive total
  const challengesCompletedThisWeek = getCompletedThisWeekCumulative();

  return {
    challengesLaunchedToday,
    challengesCompletedThisWeek,
    streaksContinuedToday,
    validationRateToday
  };
}
