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

  // Target max 85 by Sunday
  const target = 70 + Math.floor(rand() * 16); // 70..85
  const base = [5, 8, 11, 14, 17, 20, 23]; // progressive shape 5-18 range

  // Generate daily increments between 5-18
  let daily: number[] = [];
  let cumulative = 0;
  
  for (let i = 0; i < 7; i++) {
    // Base increment with some randomness
    const baseIncrement = base[i];
    const randomVariation = Math.floor((rand() - 0.5) * 6); // ±3 variation
    const increment = Math.max(5, Math.min(18, baseIncrement + randomVariation));
    
    daily.push(increment);
    cumulative += increment;
  }

  // Adjust to match target (max 85)
  let diff = target - cumulative;
  while (diff !== 0) {
    const i = Math.floor(rand() * daily.length);
    if (diff > 0 && daily[i] < 18) {
      daily[i] += 1;
      diff--;
    } else if (diff < 0 && daily[i] > 5) {
      daily[i] -= 1;
      diff++;
    } else if (diff !== 0) {
      // If we can't adjust this day, try another
      const nextI = (i + 1) % 7;
      if (diff > 0 && daily[nextI] < 18) {
        daily[nextI] += 1;
        diff--;
      } else if (diff < 0 && daily[nextI] > 5) {
        daily[nextI] -= 1;
        diff++;
      }
    }
  }

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
  
  // Challenges launched today (5-18)
  const launchedKey = `kpi_launched_${today}`;
  let challengesLaunchedToday = parseInt(localStorage.getItem(launchedKey) || '0');
  if (challengesLaunchedToday === 0) {
    challengesLaunchedToday = 5 + Math.floor(Math.random() * 14); // 5-18
    localStorage.setItem(launchedKey, challengesLaunchedToday.toString());
  }

  // Weekly progressive total
  const challengesCompletedThisWeek = getCompletedThisWeekCumulative();

  return {
    challengesLaunchedToday,
    challengesCompletedThisWeek
  };
}
