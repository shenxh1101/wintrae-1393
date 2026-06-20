const { spawn } = require('child_process')
const net = require('net')
const fs = require('fs')
const path = require('path')

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer()
    server.unref()
    server.on('error', () => {
      findAvailablePort(startPort + 1).then(resolve)
    })
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port
      server.close(() => resolve(port))
    })
  })
}

function waitForPort(port, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    function check() {
      const socket = net.connect(port, '127.0.0.1')
      socket.setTimeout(1000)
      socket.on('connect', () => {
        socket.destroy()
        resolve()
      })
      socket.on('error', () => {
        if (Date.now() - startTime > timeout) {
          reject(new Error('等待开发服务器启动超时'))
        } else {
          setTimeout(check, 500)
        }
      })
      socket.on('timeout', () => {
        socket.destroy()
        if (Date.now() - startTime > timeout) {
          reject(new Error('等待开发服务器启动超时'))
        } else {
          setTimeout(check, 500)
        }
      })
    }
    
    check()
  })
}

async function main() {
  const port = await findAvailablePort(5173)
  console.log(`\n\x1b[36m=== 开发服务器将使用端口: ${port} ===\x1b[0m\n`)
  
  process.env.VITE_DEV_PORT = String(port)
  process.env.NODE_ENV = 'development'
  
  const rootDir = path.join(__dirname, '..')
  
  const vite = spawn('npx', ['vite', '--port', String(port), '--strictPort', '--host'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  })
  
  try {
    await waitForPort(port)
    console.log('\n\x1b[32m✓ 开发服务器已启动\x1b[0m')
  } catch (err) {
    console.error('\n❌ 开发服务器启动失败:', err.message)
    vite.kill()
    process.exit(1)
  }
  
  console.log('\n编译 Electron 主进程...')
  try {
    await new Promise((resolve, reject) => {
      const tsc = spawn('npx', ['tsc', '-p', 'tsconfig.electron.json'], {
        cwd: rootDir,
        stdio: 'inherit',
        shell: true
      })
      tsc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error('TypeScript 编译失败'))
      })
    })
    console.log('\x1b[32m✓ 主进程编译完成\x1b[0m')
  } catch (err) {
    console.error('\n❌ TypeScript 编译失败')
  }
  
  console.log('\n启动 Electron...\n')
  const electron = spawn('npx', ['electron', '.'], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, NODE_ENV: 'development', VITE_DEV_PORT: String(port) }
  })
  
  electron.on('close', () => {
    vite.kill()
    process.exit(0)
  })
  
  vite.on('close', () => {
    electron.kill()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('启动失败:', err)
  process.exit(1)
})
