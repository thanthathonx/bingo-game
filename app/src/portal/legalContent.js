// Placeholder legal texts for the demo site. Replace with your own reviewed texts before publishing.

export const CONTACT = 'hello@example.com';

const P = (text) => ({ kind: 'p', text });
const UL = (...items) => ({ kind: 'ul', items });
const H = (text) => ({ kind: 'h3', text });

export const TERMS = {
  slug: 'terms',
  title: 'Terms of Service',
  subtitle: 'General Terms and Conditions',
  updated: 'Last updated: November 6, 2026',
  tint: 'purple',
  sections: [
    { title: 'Acceptance of Terms', body: [P('By opening or using PlayPals (the "Service") you agree to these Terms of Service. If you do not agree with them, please do not use the Service.')] },
    { title: 'Service Description', body: [P('PlayPals is a collection of browser party games that you can play on one device or share with friends. Some games run entirely in your browser. Features may change over time, and short interruptions can happen while we improve things.')] },
    { title: 'User Accounts', body: [P('You can play as a guest. Your name, settings and scores are stored on your own device. If online accounts are added later, you will be responsible for keeping your sign-in details safe and for everything that happens under your account.')] },
    { title: 'User Conduct', body: [P('When using the Service, please do not:'), UL('Cheat, exploit bugs or use tools that give an unfair advantage', 'Harass or insult other players, or use hateful language', 'Use the Service for anything illegal or to share harmful content', 'Pretend to be another player, a moderator or a member of staff', 'Try to disrupt the Service or the devices it runs on')] },
    { title: 'Intellectual Property & Content You Create', body: [P('The look, code, characters, sounds and texts of the Service belong to their respective owners. You may not copy, change or distribute any part of the Service without permission, except where the law expressly allows it. Custom bingo items, player names, drawings and other text you type stay yours. By entering them into a game you allow the Service to display them to the people playing with you for the length of that game, and to keep them on your own device so the game can remember your last settings. Please only enter content you own or are allowed to share, and keep it friendly. You confirm that what you enter does not break the rights of anyone else. Game hosts can remove items or players at any time, and we may remove content that breaks these Terms. If you create a card list that you would like others to use, you remain responsible for it. Nothing you type is used for advertising, sold or shared with third parties.')] },
    { title: 'Disclaimer of Warranties', body: [P('The Service is provided "as is" and "as available" without warranties of any kind. We do not promise that it will always be available, free of errors or that saved data will be kept forever. Use it at your own risk.')] },
    { title: 'Limitation of Liability', body: [P('We are fully liable for damage caused intentionally or through gross negligence, and for injury to life, body or health. For slight negligence we are only liable for breaches of essential obligations — the obligations that make the Service possible in the first place and that you may reasonably rely on. In that case liability is limited to the damage that was typical and foreseeable when you started using the Service. Any liability under mandatory product liability law is not affected. All other liability for slight negligence is excluded. Because game data is stored on your own device, we cannot restore scores or settings that were deleted by your browser.')] },
    { title: 'Withdrawal Rights (Consumers)', body: [P('If paid features are ever offered and you are a consumer, you may withdraw from a purchase within 14 days without giving a reason.'), P('To withdraw, send a clear statement (for example by email) to:'), P('PlayPals demo team'), P(`Email: ${CONTACT}`), P('If you asked for digital content to be delivered straight away and confirmed that you lose your right of withdrawal, the right ends once delivery starts. Valid refunds are paid back within 14 days using the original payment method.')] },
    { title: 'Modifications', body: [P('We may update these Terms or the Service from time to time. Changes are published on this page. If you keep using the Service after a change, the updated Terms apply.')] },
    { title: 'Governing Law', body: [P('These Terms are governed by the law of the place where the operator is established, without prejudice to mandatory consumer protection rules of your country of residence.')] },
    { title: 'Content Moderation & Reporting Problems', body: [P(`Point of contact: questions from players and from authorities can be sent to ${CONTACT}. You can write to us in English or German. Every message is read and answered by a person, not by an automated system.`), P('Reporting content: if you come across content in the Service that you believe is illegal or harmful — for example a player name, a custom bingo item or an uploaded image — send a report and include:'), UL('why you believe the content is a problem', 'where it appeared (page, game, room code, player name and, if possible, a screenshot)', 'your name and email address so we can reply', 'a statement that your report is accurate to the best of your knowledge'), P('We confirm receipt, review every report carefully and objectively, and tell you what we decided and why.'), P('How we moderate: player names, room codes and custom items pass through a simple filter that compares them with a list of offensive words. It is a fixed list, not an AI system. If it finds a match, the text is not accepted and you see a short notice in the game. Room hosts can remove players and items from their own game.'), P(`If we restrict your content: we tell you the reason and the facts behind the decision as far as we can reach you. You can object to any decision at ${CONTACT} and a person will look at it again. Your right to take legal action is not affected.`)] },
    { title: 'Contact', body: [P('Questions about these Terms? Contact us at:'), P('PlayPals demo team'), P(`Email: ${CONTACT}`)] },
  ],
};

export const PRIVACY = {
  slug: 'datenschutz',
  title: 'Privacy Policy & Cookies',
  subtitle: 'Information about the processing of personal data',
  updated: 'Last updated: November 6, 2026',
  tint: 'blue',
  sections: [
    { title: 'Data Controller', body: [P('Responsible for data processing on this website:'), P('PlayPals demo team'), P('Example Street 1, 12345 Sample City'), P(`Email: ${CONTACT}`)] },
    { title: 'Data We Collect', body: [
      H('Account Data'), P('This version has no online accounts. If you choose a player name in the sign-in window, it is saved only in your own browser so you do not have to type it again. We never receive it.'),
      H('Game Session Data'), P('The games on this site run in your browser. The room code, your player name, the cards you build, the numbers or items that are called and your scores are kept in your browser while you play and are not sent to us. When you close the tab, the round ends; only your total wins and your settings are remembered on your device.'),
      H('Technical Data'), P('When you open the site, your browser sends technical information such as your IP address, browser type, operating system, the page you asked for and the time of the request to the web host. This is needed to deliver the pages, to keep the service secure and to find technical faults. An IP address counts as personal data, so these logs are only used for those purposes and are deleted automatically after a short time.'),
      H('Local Storage'), P('We use your browser\'s local storage to remember your language, music and sound volume, mute setting, whether calls are read out loud, reduced motion, your last game settings, your custom bingo items, your name and any problem reports you wrote. This data never leaves your device and you can delete it at any time in your browser settings. Section 6 lists every item.'),
      H('Moderation of Typed Text'), P('Player names and custom bingo items are checked in your browser against a short, fixed list of offensive words before they are shown. The check is not an AI system and nothing is sent anywhere. If a word is on the list, the text is not accepted and you see a short notice.'),
      H('Custom Text About Others'), P('Items you type into event cards stay on your device. Please do not enter personal information about other people, such as full names, addresses or health details.'),
    ] },
    { title: 'How We Use Your Data', body: [P('We use the data described above only to:'), UL('Run the games and remember your preferences', 'Deliver the pages securely', 'Find and fix technical problems')] },
    { title: 'Legal Bases for Data Processing', body: [P('Where data protection law applies, we process data on these legal bases:'), UL('Performance of a contract — providing the games you choose to play', 'Legitimate interests — secure and reliable delivery of the website', 'Consent — any optional feature that asks for your permission first')] },
    { title: 'International Data Transfers', body: [P('This demo does not send game data to other countries. If the site is hosted with a provider outside your country, the provider only receives the technical data needed to deliver the pages and is bound by appropriate safeguards.')] },
    { title: 'Cookies & Local Storage', body: [P('This site does not use advertising or tracking cookies, and it does not show ads. The only items stored are the preferences listed in section 2, which are strictly necessary for the features you use. Because nothing optional is stored, no consent banner is needed. You can clear them at any time:'), UL('Language preference', 'Audio volume and mute setting', 'Whether calls are read out loud', 'Reduced motion choice', 'Your player name', 'Last used game settings and custom bingo items', 'Locally saved problem reports'), P('To delete everything at once, open your browser settings, find the site data for this address and remove it. The games keep working afterwards; they simply start with default settings again.'), { kind: 'clear' }, H('Analytics'), P('No analytics service is used. We do not count visitors, record sessions or build profiles. If this ever changes, it will only happen with your explicit consent, which you can withdraw at any time, and this policy will be updated first.')] },
    { title: 'Third-Party Services', body: [P('Fonts are bundled with the site and loaded from our own server, so no font provider receives your IP address. No analytics, advertising or social media scripts are embedded.')] },
    { title: 'Data Retention', body: [P('Local storage stays on your device until you delete it. Server logs kept by the web host are removed automatically after a short period, usually within 14 days.')] },
    { title: 'Your Rights Under GDPR', body: [P('Depending on where you live, you may have the following rights:'), UL('Right of access to the data we hold about you', 'Right to correct inaccurate data', 'Right to have data deleted', 'Right to restrict processing', 'Right to data portability', 'Right to object to processing', 'Right to complain to a data protection authority'), P(`To use any of these rights, contact ${CONTACT}.`)] },
    { title: 'Data Security', body: [P('Pages are delivered over an encrypted connection (HTTPS). Because game data stays on your device, it is only as safe as the device itself — use a screen lock on shared computers.')] },
    { title: "Children's Privacy", body: [P('The site does not knowingly collect personal data from children. Parents who believe their child entered personal data can clear the browser storage or contact us.')] },
    { title: 'Changes to This Policy', body: [P('We may update this policy when the site changes. The date at the top shows the latest version.')] },
    { title: 'Contact', body: [P('Questions about privacy? Contact us at:'), P('PlayPals demo team'), P(`Email: ${CONTACT}`)] },
  ],
};

export const IMPRINT = {
  slug: 'impressum',
  title: 'Impressum',
  subtitle: 'Legal disclosure for this website',
  updated: 'Last updated: November 6, 2026',
  tint: 'teal',
  sections: [
    { title: 'Service Provider', body: [P('PlayPals demo team'), P('Example Street 1'), P('12345 Sample City'), P('Country')] },
    { title: 'Contact', body: [P(`Email: ${CONTACT}`), P('Please use email for all enquiries — we read every message.')] },
    { title: 'Responsible for Content', body: [P('PlayPals demo team, address as above.')] },
    { title: 'Regulatory and Supervisory Authority', body: [P('Not applicable — this demo is not a licensed or regulated service.')] },
    { title: 'VAT ID', body: [P('Not applicable for this demo.')] },
    { title: 'Consumer Dispute Resolution', body: [P('We are not obliged and not willing to take part in dispute resolution proceedings before a consumer arbitration board.')] },
    { title: 'Liability for Content and Links', body: [P('We take care to keep the content of this site accurate, but cannot guarantee that it is complete or up to date. Links to other websites are checked when they are added; we are not responsible for content that changes later on those websites. If you notice a problem, please let us know and we will fix it promptly.')] },
    { title: 'Copyright', body: [P('Texts, graphics and code on this site are protected by copyright. Copying them beyond what the law allows requires the written permission of the respective author.')] },
  ],
};

export const LEGAL_TABS = [
  { href: '/datenschutz', label: 'Privacy & Cookies', short: 'Privacy', slug: 'datenschutz', icon: 'shield' },
  { href: '/terms', label: 'Terms of Service', short: 'Terms', slug: 'terms', icon: 'book' },
  { href: '/impressum', label: 'Impressum', short: 'Impressum', slug: 'impressum', icon: 'info' },
];
