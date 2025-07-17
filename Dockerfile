# ---- Base Node image ----
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.1 --activate

# ---- Dependencies ----
FROM base AS deps

# Copy package manager files
COPY package.json pnpm-lock.yaml ./

# Install dependencies (frozen lockfile for reproducibility)
RUN pnpm install --frozen-lockfile --prod=false

# ---- Build ----
FROM deps AS build

# Copy the rest of the app source code
COPY . .

# Build the Next.js app
RUN pnpm build

# ---- Production image ----
FROM base AS runner

# Set NODE_ENV to production
ENV NODE_ENV=production

# Set environment variables (document, do not hardcode secrets)
# These must be provided at runtime (e.g., via docker run -e ...)
# ENV NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# ENV SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# ENV GEMINI_API_KEY=your_gemini_api_key

# Copy built app and only production deps
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/app ./app
COPY --from=build /app/components ./components
COPY --from=build /app/hooks ./hooks
COPY --from=build /app/lib ./lib
COPY --from=build /app/styles ./styles

# Expose port (default for Next.js)
EXPOSE 3000

# Start the Next.js app
CMD ["pnpm", "start"] 