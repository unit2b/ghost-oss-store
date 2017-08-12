const fs = require('fs')
const path = require('path')

const OSS = require('ali-oss').Wrapper
const Promise = require('bluebird')
const BaseAdapter = require('ghost-storage-base')

class OSSAdapter extends BaseAdapter {
  constructor (config) {
    super()
    this.options = config || {}
    this.client = new OSS(this.options)
  }

  save (file, targetDir) {
    var client = this.client
    var origin = this.options.origin
    var prefix = this.options.prefix || '/'

    targetDir = targetDir || this.getTargetDir(prefix)

    return this.getUniqueFileName(file, targetDir).then((filename) => {
      return client.put(filename, fs.createReadStream(file.path))
    }).then((result) => {
      if (origin) {
        // not using path.join, because origin may contains 'https://'
        return origin + result.name
      } else {
        return result.url
      }
    }).catch((e) => {
      return Promise.reject(e)
    })
  }

  exists (filename) {
    var client = this.client

    return new Promise(function (resolve, reject) {
      return client.head(filename).then(function (result) {
        resolve(true)
      }).catch(function (err) {
        resolve(false)
      })
    })
  }

  serve () {
    return function (req, res, next) {
      next()
    }
  }

  delete (filename) {
    return Promise.reject('not implemented')
  }

  read(options) {
    // remove trailing slashes
    options = options || {}
    options.path = (options.path || '').replace(/\/$|\\$/, '');

    var client = this.client

    var prefix = this.options.prefix || '/'
    var targetPath = path.join(prefix, options.path)

    return client.get(targetPath).then((res) => {
      return res.content
    }).catch((e) => {
      return Promise.reject(e)
    })
  }

}

module.exports = OSSAdapter
