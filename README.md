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

## Server prerequisites

Video cropping runs `yt-dlp` and `ffmpeg` on the server. The production Docker image
installs both, including yt-dlp's EJS dependencies, and uses Node.js 22 as the
JavaScript runtime required for current YouTube extraction:

```bash
docker build --pull -t youtube-clone .
docker run --rm -p 3000:3000 --env-file .env.local youtube-clone
```

Rebuild the image regularly with `--pull` so yt-dlp stays current. For a non-Docker
deployment, install `ffmpeg` and Python 3, then run
`python3 -m pip install -U "yt-dlp[default]"`. Node.js 22 or newer must be on
`PATH`. `YT_DLP_BIN` and `FFMPEG_BIN` can be set when the executables are installed
outside `PATH`.

YouTube may reject downloads from hosting-provider IP addresses with HTTP 403 even
when both tools are installed. The downloader retries with token-free YouTube
clients, but production deployments should provide a Netscape-format cookie file
through `YT_DLP_COOKIES_FILE`. You can also set `YT_DLP_PROXY` and pass current
YouTube extractor configuration (including PO-token provider/client settings) in
`YT_DLP_EXTRACTOR_ARGS`. Keep the cookie file outside the repository and mount it
read-only into the container, for example:

```bash
docker run --rm -p 3000:3000 --env-file .env.local \
  -v /secure/youtube-cookies.txt:/run/secrets/youtube-cookies.txt:ro \
  -e YT_DLP_COOKIES_FILE=/run/secrets/youtube-cookies.txt youtube-clone
```

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
