export type Gender = 'female' | 'male' | null;
export type GreetingTone = 'friendly' | 'professional';

export interface LearnerGreeting {
  headlinePrefix: string;  // e.g. "Good morning girrrlll" or "Good morning, my guy"
  learnerName: string;     // First name of learner
  punctuation: string;     // "!" or "."
  subtitle: string;        // Contextual follow-up sentence
}

/**
 * Returns a smooth, culturally grounded Zambian greeting blending time of day,
 * gender, and tone preference.
 */
export function getLearnerGreeting(
  fullNameOrDisplay: string | null | undefined,
  gender?: Gender,
  tone: GreetingTone = 'friendly'
): LearnerGreeting {
  const firstName = (fullNameOrDisplay || '').trim().split(' ')[0] || 'friend';
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  // 1. Strictly Professional mode
  if (tone === 'professional') {
    const timeWord = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
    return {
      headlinePrefix: timeWord,
      learnerName: firstName,
      punctuation: '.',
      subtitle: 'Pick up where you left off in your financial education curriculum.',
    };
  }

  // 2. Friendly & Relatable mode
  if (gender === 'female') {
    switch (timeOfDay) {
      case 'morning':
        return {
          headlinePrefix: 'Good morning girrrlll',
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Ready to make moves today? Pick up right where you left off.',
        };
      case 'afternoon':
        return {
          headlinePrefix: 'Good afternoon girrrlll',
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Hope your day is moving smoothly. Ready to jump back in?',
        };
      case 'evening':
        return {
          headlinePrefix: 'Good evening girrrlll',
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Time to wind down and sharpen your money wisdom tonight.',
        };
    }
  }

  if (gender === 'male') {
    // Alternates naturally between "my guy" and "Ba Ponono" based on date
    const useBaPonono = new Date().getDate() % 2 === 0;
    const title = useBaPonono ? 'Ba Ponono' : 'my guy';

    switch (timeOfDay) {
      case 'morning':
        return {
          headlinePrefix: `Good morning, ${title}`,
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Ready to make moves today? Pick up right where you left off.',
        };
      case 'afternoon':
        return {
          headlinePrefix: `Good afternoon, ${title}`,
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Hope the hustle is moving well today. Let’s keep up the momentum.',
        };
      case 'evening':
        return {
          headlinePrefix: `Good evening, ${title}`,
          learnerName: firstName,
          punctuation: '!',
          subtitle: 'Wrapping up the day strong tonight with fresh financial skills.',
        };
    }
  }

  // 3. Friendly Default (unspecified or neutral)
  const timeWord = timeOfDay === 'morning' ? 'Good morning' : timeOfDay === 'afternoon' ? 'Good afternoon' : 'Good evening';
  return {
    headlinePrefix: timeWord,
    learnerName: firstName,
    punctuation: '!',
    subtitle: 'Mwaiseni mukwai! Pick up right where you left off.',
  };
}
