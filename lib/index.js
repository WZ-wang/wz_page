// // TODO: Implement module
// module.exports = (name, options) => {
//   if (typeof name !== 'string') {
//     throw new TypeError(`Expected a string, got ${typeof name}`)
//   }

//   options = Object.assign({}, options)

//   return `${name}@${options.host || 'zce.me'}`
// }
// 实现这个项目的构建任务
const {
  src,
  dest,
  series,
  parallel,
  watch
} = require("gulp") //src读文件，dest写文件
const plugins = require('gulp-load-plugins')() //gulp插件
const del = require('del') //删除文件
const browerSync = require('browser-sync').create() //服务器
const cwd = process.cwd()
let config = {
  build:{
    src:"src",
    dist:"dist",
    temp:"temp",
    public:"public",
    paths:{
      styles:"assets/style/*.scss",
      scripts:"assets/scripts/*.js",
      pages:"**.html",
      images:"assets/images/**",
      fonts:"assets/fonts/**",
    }
  }
}
try{
  const loadConfig = require(`${cwd}/pages.config.js`)
  config = Object.assign({},config,loadConfig)
}catch(e){
}
// const data = {
//   menus: [{
//       name: 'Home',
//       icon: 'aperture',
//       link: 'index.html'
//     },
//     {
//       name: 'Features',
//       link: 'features.html'
//     },
//     {
//       name: 'About',
//       link: 'about.html'
//     },
//     {
//       name: 'Contact',
//       link: '#',
//       children: [{
//           name: 'Twitter',
//           link: 'https://twitter.com/w_zce'
//         },
//         {
//           name: 'About',
//           link: 'https://weibo.com/zceme'
//         },
//         {
//           name: 'divider'
//         },
//         {
//           name: 'About',
//           link: 'https://github.com/zce'
//         }
//       ]
//     }
//   ],
//   pkg: require('./package.json'),
//   date: new Date()
// }
// 样式  gulp-sass将scss样式进行转换
const style = () => {
  return src(config.build.paths.styles, {
      base: config.build.src,cwd:config.build.src
    }) //base设置基础路径
    .pipe(plugins.sass({
      outputStyle: 'expanded'
    }))
    .pipe(dest(config.build.temp))
    .pipe(browerSync.reload({stream:true}))
}
//gulp-babel将ES6转化为正常语法
const script = () => {
  return src(config.build.paths.scripts, {
      base: config.build.src,cwd:config.build.src
    }) //base设置基础路径
    .pipe(plugins.babel({
      presets: [require('@babel/preset-env')]
    })) //语法转换配置
    .pipe(dest(config.build.temp))
    .pipe(browerSync.reload({stream:true}))
}
//gulp-swig
const page = () => {
  return src(config.build.paths.pages, {
      base: config.build.src,
      cwd:config.build.src
    }) //base设置基础路径
    .pipe(plugins.swig({
      data:config.data, defaults: { cache: false }   //html数据和防止模板缓存导致页面不能及时更新
    })) //html转换配置
    .pipe(dest(config.build.temp))
    .pipe(browerSync.reload({stream:true}))
}
// gulp-imagemin压缩文件
const image = () => {
  return src(config.build.paths.images, {
      base: config.build.src,
      cwd:config.build.src
    })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
const font = () => {
  return src(config.build.paths.fonts, {
      base: config.build.src,
      cwd:config.build.src
    })
    .pipe(plugins.imagemin())
    .pipe(dest(config.build.dist))
}
const public = () => {
  return src('**', {base:config.build.public,cwd:config.build.public})
    .pipe(dest(config.build.dist))
}
const serve = () => {
  watch(config.build.paths.styles,style)
  watch(config.build.paths.scripts,{cwd:config.build.src},script)
  watch(config.build.paths.pages,{cwd:config.build.src}, page)
  watch('**', {cwd:config.build.public},browerSync.reload)
  watch([config.build.paths.fonts,config.build.paths.images],{cwd:config.build.src},browerSync.reload)
  browerSync.init({
    notify: false,
    port: 9000,  //自定义端口
    // open:false,  //是否自动打开
    server: {
      baseDir: [config.build.temp, config.build.src, config.build.public], //基础目录
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}
//gulp-useref 将js，html，css合并
const useref = () => {
  return src(config.build.paths.pages, { base: config.build.temp,cwd:config.build.temp })
      .pipe(plugins.useref({ searchPath: [config.build.temp, '.'] }))
      .pipe(plugins.if(/\.js$/, plugins.uglify()))  //压缩文件
      .pipe(plugins.if(/\.css$/, plugins.cleanCss())) //减少css
      .pipe(plugins.if(/\.html$/, plugins.htmlmin({  //压缩html
          removeComments: true,
          collapseWhitespace: true, //压缩HTML
          minifyCSS: true,  //压缩页面CSS
          collapseBooleanAttributes: true,  //省略布尔属性的值 <input checked="true"/> ==> <input checked />
          removeEmptyAttributes: true,  //删除所有空格作属性值 <input id="" /> ==> <input />
          removeScriptTypeAttributes: true,  //删除<script>的type="text/javascript"
          removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
          minifyJS: true//压缩页面JS
      })))
      .pipe(dest(config.build.dist))
}
// 删除文件del
const delFile = () => {
  return del([config.build.dist,config.build.temp])
}
const combile = parallel(style, script, page)
const start = series(combile,serve)
const build = series(delFile, parallel(series(combile,useref), image, font, public))
module.exports = {
  delFile,
  start,
  build
}

