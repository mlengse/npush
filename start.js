const exec = require('child_process').exec 

module.exports = file => {
  console.log(`Starting app in xvfb`)

  const build = exec(`xvfb-run -a --server-args="-screen 0 1280x800x24 -ac -nolisten tcp -dpi 96 +extension RANDR" node ${file}.js`, { 
    stdio: 'inherit', windowsHide: true 
  })

  build.stdout && build.stdout.on('data', console.log)
  build.stderr && build.stderr.on('data', console.error)

  build.on('close', (code) => {
    if (code !== 0) {
      console.log(`Build process exited with code ${code}`)
    }

    if (build.stdin) {
      build.stdin.end()
    }
  })
}
