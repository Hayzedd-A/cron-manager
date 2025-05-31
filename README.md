Cron Job Manager for Endpoint Pinging
A robust cron job manager designed to keep free servers up and running by sending repeated GET requests to specified endpoints. This tool helps prevent servers from going inactive due to prolonged inactivity, ensuring they remain responsive and available.

Key Features
- User Account Management: Create an account to manage your services
- Service Creation: Create up to 5 services per account, each with a customizable endpoint and ping interval
- Service Monitoring: View detailed service information, including:
    - Uptime and downtime statistics
    - Current status (active or paused)
    - Last ping timestamp and response time
- Service Control: Pause or resume services as needed to manage your server's activity

Use Cases
- Keep free servers (e.g., Render) active and responsive by sending regular pings
- Monitor and manage multiple services from a single dashboard
- Easily pause or resume services to adapt to changing server needs

Technical Details
- Built with [Next.js, Typescript, MongoDB]
- Utilizes cron jobs to schedule and manage repeated GET requests
- Stores service data and user information in a secure database

Getting Started
1. Clone the repository and follow the setup instructions
2. Create an account and start creating services
3. Configure your services and monitor their status

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
