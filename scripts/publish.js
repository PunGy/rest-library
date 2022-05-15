const fs = require('node:fs')
const { exec } = require('node:child_process')

const files = fs.readdirSync('./src')

files.forEach(file => {
    fs.writeFileSync(`./${file}`, fs.readFileSync(`./src/${file}`))
})

exec('npm publish', { stdio: [0, 1, 2] }, (error, stdout, stderr) => {
    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)
    if (error) console.error(error)

    files.forEach(file => {
        fs.unlinkSync(`./${file}`)
    })
})
