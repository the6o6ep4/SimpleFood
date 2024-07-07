const { src, dest, watch, parallel, series } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const browserSync = require("browser-sync").create();

async function cleanDist() {
  const del = (await import("del")).default;
  return del(["dist"]);
}

function browsersync() {
  browserSync.init({
    server: {
      baseDir: "./app",
    },
    port: 3000,
    notify: false,
  });
}

async function styles() {
  const autoprefixer = (await import("gulp-autoprefixer")).default;

  return src("app/scss/style.scss")
    .pipe(sass({ outputStyle: "expanded" }).on("error", sass.logError))
    .pipe(concat("style.min.css"))
    .pipe(
      autoprefixer({
        grid: true,
        overrideBrowserslist: [
          "last 10 versions",
          "Safari >= 6",
          "iOS >= 6",
          "Android >= 4",
        ],
        cascade: false,
      })
    )
    .pipe(dest("app/css"))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(["node_modules/jquery/dist/jquery.js", "app/js/main.js"])
    .pipe(concat("main.min.js"))
    .pipe(uglify())
    .pipe(dest("app/js"))
    .pipe(browserSync.stream());
}

async function images() {
  const imagemin = (await import("gulp-imagemin")).default;
  const gifsicle = (await import("imagemin-gifsicle")).default;
  const mozjpeg = (await import("imagemin-mozjpeg")).default;
  const optipng = (await import("imagemin-optipng")).default;
  const svgo = (await import("imagemin-svgo")).default;

  return src("app/images/**/*.*")
    .pipe(
      imagemin([
        gifsicle({ interlaced: true }),
        mozjpeg({ quality: 75, progressive: true }),
        optipng({ optimizationLevel: 5 }),
        svgo({
          plugins: [
            { name: "removeViewBox", active: true },
            { name: "cleanupIDs", active: false },
          ],
        }),
      ])
    )
    .pipe(dest("dist/images"))
    .pipe(browserSync.stream());
}

function build() {
  return src(["app/**/*.html", "app/css/style.min.css", "app/js/main.min.js"], {
    base: "app",
  }).pipe(dest("dist"));
}

function watching() {
  console.log("Watching files for changes...");
  watch("app/scss/**/*.scss", styles);
  watch(["app/js/**/*.js", "!app/js/main.min.js"], scripts);
  watch("app/**/*.html").on("change", browserSync.reload);
}

exports.init = series(cleanDist, parallel(styles, scripts, images), build);
exports.styles = styles;
exports.scripts = scripts;
exports.browsersync = browsersync;
exports.watching = watching;
exports.images = images;
exports.build = build;
exports.default = parallel(styles, scripts, browsersync, watching);
