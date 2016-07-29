var React = require('react')
var ReactNative = require('react-native')
var htmlparser = require('./vendor/htmlparser2')
var entities = require('./vendor/entities')

var {
  Text,
  View
} = ReactNative

var LINE_BREAK = '\n';
var PARAGRAPH_BREAK = '\n';
var BULLET = '\u2022 ';
var inlineElements = ['a','span','em','font','label','b','strong','i','small'];

function htmlToElement(rawHtml, opts, done) {
  function domToElement(dom, parent) {
    if (!dom) return null

    let domLen = dom.length;
    let domTemp = {};

    var getNodeData = function(node){
      let nodeData = null;
      if(node.children.length){
        let nodeChild = node.children[0];
        if(nodeChild && nodeChild.data){
          nodeData = nodeChild.data;
        }else{
          nodeData = getNodeData(nodeChild);
        }
      }
      return nodeData;
    };

    var renderInlineNode = function(index){
      let thisIndex = index + 1;
      if(thisIndex < domLen){
        let nextNode = dom[thisIndex];
        if(inlineElements.includes(nextNode.name)){
          domTemp[thisIndex] = true;
          let linkPressHandler = null;
          if (nextNode.name == 'a' && nextNode.attribs && nextNode.attribs.href) {
            linkPressHandler = () => opts.linkHandler(entities.decodeHTML(nextNode.attribs.href))
          }
          let nodeData = getNodeData(nextNode);
          return (
            <Text key={index} onPress={linkPressHandler} style={ opts.styles[nextNode.name]}>
              { entities.decodeHTML(nodeData) }
              { renderInlineNode(thisIndex)}
            </Text>
          )
        }
        if(nextNode.type == 'text'){
          domTemp[thisIndex] = true;
          return (
            <Text style={ opts.styles['span'] } onPress={()=>null}>
              { entities.decodeHTML(nextNode.data) }
              { renderInlineNode(thisIndex)}
            </Text>
          )
        }
      }
      return null;
    };

    return dom.map((node, index, list) => {

      if(domTemp[index] === true){
        return;
      }

      if (opts.customRenderer) {
        let rendered = opts.customRenderer(node, index, list)
        if (rendered || rendered === null) return rendered;
      }

      if (node.type == 'text' && node.data.trim()!='') {
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

              { renderInlineNode(index) }

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
