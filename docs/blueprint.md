# **App Name**: AirdropAce

## Core Features:

- Dashboard Summary: Display a personalized dashboard with a summary of tracked airdrops, including total, ongoing, and upcoming events, as well as progress bars and calendar reminders.
- Google Sign-In: Enable Google Sign-In as the primary login method.
- Add Airdrop Button: Add a prominent button to initiate the addition of a new airdrop.
- Add Airdrop Modal: Implement a modal for adding new airdrops, featuring optional fields such as Airdrop Name, Start Date, Deadline, Description, and Task Checklist. Persist temporary storage of the data even if the user closes the modal without saving. The save button is disabled until the user fills at least one field.
- Edit/Delete Airdrops: Enable editing and deletion of added airdrop data.
- Filter and Search: Implement filtering and searching of airdrops based on status: all, active, completed, upcoming.

## Style Guidelines:

- Primary color: Indigo (#4B0082), providing a modern, serious, and reliable look. Its brightness is appropriate for use as the primary color on a dark background.
- Background color: Dark navy (#121E33), a very desaturated hue near indigo for a clean dark-mode appearance.
- Accent color: Yellow-orange (#FFA500) used sparingly to draw the user's attention to key details. Chosen because it's about 30 degrees away from indigo on the color wheel.
- Font choice: 'Inter' (sans-serif) for both headlines and body text. This is a font suitable for UIs and known for its clean appearance and legibility.
- Dashboard layout: User greeting and info at the top, user profile card on the top left, add airdrop button on the top right, total summary on the bottom left, calendar or notifications on the bottom right, and a list of airdrops in a minimalist card or table format below.
- Input fields in modal: A gradient outline animates on hover or focus, starting from the bottom right to the top left using indigo, red, orange, and yellow. The glowing outline remains active while the field is focused or the cursor is inside, fading smoothly on blur but maintaining a visible outline when input is active.
- Loader style: A modern loader consisting of a rotating gradient circle (no text) displayed during data saving processes.