function preferDownloadOs() {
  const windows = document.querySelector('[data-os="windows"]')
  const linux = document.querySelector('[data-os="linux"]')
  const mac = document.querySelector('[data-os="macos"]')
  const primary = document.getElementById('download-primary')
  if (!windows || !linux || !mac || !primary) return
  const linuxOs = /Linux/.test(navigator.userAgent) && !/Android/.test(navigator.userAgent)
  const macOs = /Mac/.test(navigator.platform || '') || /Mac OS X/.test(navigator.userAgent)
  const match = linuxOs ? linux : macOs ? mac : null
  if (!match) return
  primary.href = match.href
  const label = primary.querySelector('span')
  if (label) label.textContent = match === linux ? 'Download for Linux' : 'Download for macOS'
  const icon = match.querySelector('svg')
  const current = primary.querySelector('svg')
  if (icon && current) current.replaceWith(icon.cloneNode(true))
  windows.classList.remove('button--suggested')
  linux.classList.remove('button--suggested')
  mac.classList.remove('button--suggested')
  match.classList.add('button--suggested')
}

function releaseVersion(tag) {
  const match = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag)
  if (!match) return null
  return match.slice(1).map(Number)
}

function byNewest(left, right) {
  const a = releaseVersion(left.tag_name)
  const b = releaseVersion(right.tag_name)
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return b[i] - a[i]
  }
  return 0
}

function releaseAsset(release, suffix) {
  return (release.assets || []).find((item) => item.name.endsWith(suffix))
}

function applyRelease(releases) {
  const stable = releases
    .filter((release) => !release.draft && !release.prerelease && releaseVersion(release.tag_name))
    .sort(byNewest)
  const newest = stable[0]
  if (!newest) return
  const version = newest.tag_name.slice(1)
  document.querySelectorAll('[data-release="version"]').forEach((node) => {
    node.textContent = version
  })
  document.querySelectorAll('[data-release="notes"]').forEach((node) => {
    node.href = newest.html_url
    node.textContent = `Release ${version}`
  })
  const windowsRelease = stable.find((release) => releaseAsset(release, '-windows-setup.exe'))
  const linuxRelease = stable.find((release) => releaseAsset(release, '-linux.AppImage'))
  const macRelease = stable.find((release) => releaseAsset(release, '-mac.dmg'))
  const windows = windowsRelease && releaseAsset(windowsRelease, '-windows-setup.exe')
  const linux = linuxRelease && releaseAsset(linuxRelease, '-linux.AppImage')
  const mac = macRelease && releaseAsset(macRelease, '-mac.dmg')
  if (windows) {
    document.querySelectorAll('[data-os="windows"]').forEach((node) => {
      node.href = windows.browser_download_url
    })
    const primary = document.getElementById('download-primary')
    if (primary) primary.href = windows.browser_download_url
  }
  if (linux) {
    document.querySelectorAll('[data-os="linux"]').forEach((node) => {
      node.href = linux.browser_download_url
    })
  }
  if (mac) {
    document.querySelectorAll('[data-os="macos"]').forEach((node) => {
      node.href = mac.browser_download_url
    })
  }
  preferDownloadOs()
}

preferDownloadOs()

fetch('https://api.github.com/repos/riandredev/orion/releases?per_page=30')
  .then((response) => (response.ok ? response.json() : null))
  .then((releases) => {
    if (Array.isArray(releases)) applyRelease(releases)
  })
  .catch(() => {})
