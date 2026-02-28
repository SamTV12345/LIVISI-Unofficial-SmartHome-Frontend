pipeline {
  agent any

  options {
    timestamps()
    ansiColor('xterm')
  }

  environment {
    IMAGE_REPO = 'samtv19982/gateway'
    CHARTS_DIR = '/home/jenkins/workspace/LivisiCharts'
    VALUES_FILE = '/home/jenkins/workspace/LivisiCharts/values-dynamic.yaml'
  }

  stages {
    stage('Build UI (embedded)') {
      steps {
        sh '''
          set -euo pipefail

          corepack enable || true
          corepack prepare pnpm@10.11.0 --activate || true

          pnpm -C ui-new install --frozen-lockfile
          pnpm -C ui-new run build

          rm -rf api/static/*
          cp -R ui-new/dist/. api/static/

          test -f api/static/index.html
          echo "UI build copied to api/static for Rust embedding."
        '''
      }
    }

    stage('Build Rust binaries') {
      steps {
        sh '''
          set -euo pipefail
          cd api

          docker run --rm \
            -v cargo-armv7liv:/root/.cargo \
            -v "$(pwd):/home/rust/src" \
            -w /home/rust/src \
            blackdex/rust-musl:armv7-musleabihf-stable-1.93.0 \
            cargo build --release

          docker run --rm \
            -v cargo-ax86liv:/root/.cargo \
            -v "$(pwd):/home/rust/src" \
            -w /home/rust/src \
            blackdex/rust-musl:x86_64-musl-stable-1.93.0 \
            cargo build --release

          docker run --rm \
            -v cargo-aarch64liv:/root/.cargo \
            -v "$(pwd):/home/rust/src" \
            -w /home/rust/src \
            blackdex/rust-musl:aarch64-musl-stable-1.93.0 \
            cargo build --release
        '''
      }
    }

    stage('Build and push image') {
      steps {
        sh '''
          set -euo pipefail
          cd api

          echo "${DOCKERHUB_PASSWORD}" | docker login -u "${DOCKERHUB_NAME}" --password-stdin

          SHA_TAG="$(git rev-parse --short=12 HEAD)"
          docker buildx bake --push --set "*.tags=${IMAGE_REPO}:${SHA_TAG}"
          docker buildx imagetools create -t "${IMAGE_REPO}:latest" "${IMAGE_REPO}:${SHA_TAG}"

          IMAGE_DIGEST="$(docker buildx imagetools inspect "${IMAGE_REPO}:${SHA_TAG}" | sed -n 's/^Digest:[[:space:]]*//p' | head -n1)"
          if [ -z "${IMAGE_DIGEST}" ]; then
            echo "ERROR: Could not resolve image digest."
            exit 1
          fi

          echo "${IMAGE_DIGEST}" > ../.image_digest
          echo "Published digest: ${IMAGE_DIGEST}"
        '''
      }
    }

    stage('Update Helm values (digest)') {
      steps {
        sh '''
          set -euo pipefail

          IMAGE_DIGEST="$(cat .image_digest)"
          CHARTS_REPO="https://${LIVISI_USER}:${LIVISI_PASSWORD}@github.com/SamTV12345/LIVISI-Unofficial-SmartHome-Frontend-charts.git"

          if [ -d "${CHARTS_DIR}/.git" ]; then
            git -C "${CHARTS_DIR}" fetch origin main
            git -C "${CHARTS_DIR}" checkout main
            git -C "${CHARTS_DIR}" pull --ff-only origin main
          else
            rm -rf "${CHARTS_DIR}"
            git clone "${CHARTS_REPO}" "${CHARTS_DIR}"
          fi

          if grep -qE '^[[:space:]]*digest:' "${VALUES_FILE}"; then
            sed -i -E "s|^([[:space:]]*digest:).*|\\1 \\"${IMAGE_DIGEST}\\"|g" "${VALUES_FILE}"
          else
            if grep -qE '^[[:space:]]*image:[[:space:]]*$' "${VALUES_FILE}"; then
              awk -v digest="${IMAGE_DIGEST}" '
                BEGIN { inserted=0 }
                /^image:[[:space:]]*$/ {
                  print
                  print "  digest: \\"" digest "\\""
                  inserted=1
                  next
                }
                { print }
                END {
                  if (!inserted) {
                    print ""
                    print "image:"
                    print "  digest: \\"" digest "\\""
                  }
                }
              ' "${VALUES_FILE}" > "${VALUES_FILE}.tmp"
              mv "${VALUES_FILE}.tmp" "${VALUES_FILE}"
            else
              printf "\\nimage:\\n  digest: \\"%s\\"\\n" "${IMAGE_DIGEST}" >> "${VALUES_FILE}"
            fi
          fi

          if grep -qE '^[[:space:]]*tag:' "${VALUES_FILE}"; then
            sed -i -E 's|^([[:space:]]*tag:).*|\\1 "latest"|g' "${VALUES_FILE}"
          fi

          git -C "${CHARTS_DIR}" config user.name "Livisi Support Bot"
          git -C "${CHARTS_DIR}" config user.email "noreply@samtv.fyi"
          git -C "${CHARTS_DIR}" add "${VALUES_FILE}"

          if git -C "${CHARTS_DIR}" diff --cached --quiet; then
            echo "No chart changes (digest unchanged)."
            exit 0
          fi

          git -C "${CHARTS_DIR}" commit -m "ci: update gateway digest to ${IMAGE_DIGEST}"
          git -C "${CHARTS_DIR}" push origin main
        '''
      }
    }
  }
}
