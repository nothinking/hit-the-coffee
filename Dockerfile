FROM mdock.daumkakao.io/node:18-alpine
# 보안점검 이슈 대응
# https://kakao.agit.in/g/300003371/wall/408612353#comment_panel_409208112
RUN apk --no-cache add shadow && usermod --shell /sbin/nologin node

WORKDIR /app

ARG PHASE
ENV TZ=Asia/Seoul LANG=ko_KR.UTF-8 LANGUAGE=ko_KR.UTF-8 LC_ALL=ko_KR.UTF-8 PHASE=${PHASE}

COPY . .
RUN npm install && npm run build

# .next 폴더 생성 및 권한 설정
RUN chown -R nobody:nobody .next && chmod -R u+w .next

USER nobody

EXPOSE 3000

ENTRYPOINT ["sh", "-c", "npm run start"]