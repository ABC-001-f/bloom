# BloomOS — your mind, made visible

**Tagline:** A learning dashboard that turns invisible progress into a living garden — so people keep going, gently.

## Inspiration

Online learners start strong and then quietly drift away. In a large study of MIT and Harvard courses on edX, only about 3% of learners who enrolled in 2017–18 went on to complete their courses (Reich & Ruipérez-Valiente, *Science*, 2019).

It's rarely a lack of motivation on day one. Progress is invisible, a missed day feels like failure, and most learning dashboards look like spreadsheets. We wanted a dashboard people would *want* to open.

## What it does

Every skill you learn becomes a plant in your garden. Each lesson waters it, and it grows from seed to sprout to full bloom.

- **Three-question onboarding:** your name, what you want to grow, and a daily "watering" goal. You can start with sample progress or a fresh garden.
- **Home:** today's watering goal, one clear "continue" lesson, an interactive garden scene (tap the water to make ripples), and a weekly activity chart.
- **One small step:** every lesson is a single card with a tip, a three-item checklist and an optional 10-minute focus timer.
- **My Garden:** each course is drawn as a plant that grows with your progress. Plant health is shown as Thriving, Thirsty or Wilting, never as red failure states.
- **Goals:** goals linked to a course track themselves. Others can be counted by hand. Deadlines are highlighted when they get close.
- **Achievements:** 12 badges. Locked ones show exactly how close you are.
- **Community "Greenhouse":** posts, tags, cheers, weekly prompts and a friendly leaderboard.
- **Delight:** a blooming-lotus preloader, falling petals when you hit your daily goal, and a dawn garden that becomes a night garden in dark mode.

## Design decisions

| Principle | How it shows up |
|---|---|
| Make progress visible | The garden metaphor. Every lesson visibly grows a plant. |
| Gentle, not guilt | Plants get "thirsty" instead of showing errors. A streak survives until the day actually ends. |
| One small step | "Continue" always opens exactly one lesson. |
| You're in control | You choose the daily goal and how goals are tracked. You can export, import or reset your data. |
| Calm by default | A soft light theme, an optional dark theme, and motion that can be turned off completely. |

## Accessibility

- Light, dark and system themes, each with its own text colours chosen for contrast.
- A text-size setting. The whole UI uses `rem` units, so it also respects the browser's font size.
- A reduce-motion toggle. The operating system's "reduce motion" setting is also honoured automatically.
- Full keyboard support:
  - a skip link
  - `/` or `Ctrl+K` to open search, with arrow keys to move through results
  - arrow keys inside option groups
  - focus stays inside dialogs while they're open
- Status is never shown by colour alone. Plant health, goals and badges always pair colour with an icon and a label.
- Labelled landmarks, progress bars that announce their values, and live regions for notifications.
- Deleting and resetting ask for confirmation right where you clicked, never in a surprise pop-up.
- Responsive from small phones (with a bottom navigation dock) to wide desktops. Windows high-contrast mode is supported.

## How we built it

- Hand-written HTML, CSS and JavaScript, with no frameworks and no build step.
- One design-token system drives both themes and all four accent colours.
- All state lives in `localStorage` and never leaves the device.
- The animated water is a `<canvas>`, the plants are generated SVG, and the preloader is inline SVG with CSS animation.
- The preloader is inlined in each page so it paints before anything else, and an inline script applies the saved theme before the first paint, so the page never flashes the wrong theme.

## Challenges

- Making both themes feel designed rather than inverted. The garden scene has its own dawn and night palettes, not just swapped colours.
- Keeping a lot of motion (ripples, a floating lotus, petals) while making all of it optional and respectful of reduced-motion preferences.
- Showing the full product on first load without overwhelming a new user. Onboarding offers sample progress or a fresh start.

## What's next

- Real course content and integrations with existing learning platforms.
- Accounts and sync across devices.
- Shared "community gardens" for study groups and classrooms.
- Reminders delivered as notifications.

## Try it

Open `index.html` in a browser. There's nothing to install. The **About & case study** page inside the app walks through the problem, the persona, the design principles and the user flow.
