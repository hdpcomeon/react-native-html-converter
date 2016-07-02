var React = require('react')
var ReactNative = require('react-native')
var htmlparser = require('./vendor/htmlparser2')
var entities = require('./vendor/entities')

var {
  Text,
  View
} = ReactNative

var LINE_BREAK = '\n'
var PARAGRAPH_BREAK = '\n'
var BULLET = '\u2022 '

function htmlToElement(rawHtml, opts, done) {
  function domToElement(dom, parent) {
    if (!dom) return null

    return dom.map((node, index, list) => {
      if (opts.customRenderer) {
        let rendered = opts.customRenderer(node, index, list)
        if (rendered || rendered === null) return rendered;
      }

      if (node.type == 'text') {

        let linkPressHandler = null;
        if (parent && parent.name == 'a' && parent.attribs && parent.attribs.href) {
          linkPressHandler = () => opts.linkHandler(entities.decodeHTML(parent.attribs.href))
        }

        return (
          <Text key={index} onPress={linkPressHandler} style={parent ? opts.styles[parent.name] : null}>

              { parent && parent.name == 'pre'? LINE_BREAK : null }
              { parent && parent.name == "li"? BULLET : null }
              { parent && parent.name == 'br'? LINE_BREAK : null }
              { parent && parent.name == 'p' && index < list.length - 1 ? PARAGRAPH_BREAK : null }
              { parent && parent.name == 'h1' || parent && parent.name == 'h2' || parent && parent.name == 'h3' || parent && parent.name == 'h4' || parent && parent.name == 'h5'? PARAGRAPH_BREAK :null }
            

            { entities.decodeHTML(node.data) }
          </Text>
        )
      }

      if (node.type == 'tag') {
        return (
          <View key={ index }>
            { domToElement(node.children, node) }
          </View>
        )
      }
    })
  }

  var handler = new htmlparser.DomHandler(function(err, dom) {
    if (err) done(err)
    done(null, domToElement(dom))
  })
  var parser = new htmlparser.Parser(handler)
  parser.write(rawHtml)
  parser.done()
}

module.exports = htmlToElement
