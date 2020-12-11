#!/usr/bin/env node
// cli入口
// process.argv传递参数
process.argv.push("--cwd")
process.argv.push(process.cwd())
process.argv.push('--gulpfile')
process.argv.push(require.resolve('..'))
require('gulp/bin/gulp')