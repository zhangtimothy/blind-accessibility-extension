let API_KEY = '';

let http = function(method, url, body, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 400) {
            notify('API request failed');
            console.log('XHR failed', xhr.responseText);
            return;
        }
        cb(JSON.parse(xhr.responseText));
    };
    xhr.send(body);
}

http('GET', chrome.runtime.getURL('config.json'), '', function(obj) {
    API_KEY = obj.key;
    document.dispatchEvent(new Event('config-loaded'));
});

let detect = function(type, imgUrl, cb) {
    console.log('imgurl:', imgUrl);
    let url = 'https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY;
    let data = {
        requests: [{
            image: {'source': {'imageUri': imgUrl}},
            features: [{'type': type}]
        }]
    };
    http('POST', url, JSON.stringify(data), cb);
};

let notify = function(title, message) {
    chrome.notifications.create('', {
        'type': 'basic',
        'iconUrl': 'images/get_started128.png',
        'title': title,
        'message': message || ''
    }, function(nid) {
        window.setTimeout(function() {
            chrome.notifications.clear(nid);
        }, 4000);
    });
};

chrome.contextMenus.create({
    title: 'Label Detection',
    contexts: ['image'],
    onclick: function(obj) {
        detect('LABEL_DETECTION', obj.srcUrl, function(data) {
            let alertLabelsOutput = 'An image of ';
            let labels = [];
            data.responses[0].labelAnnotations.forEach(element => labels.push(element.description));

            alertLabelsOutput += labels.slice(0, 3).join(', ');
            
            alert(alertLabelsOutput);
            notify('REQUEST DONE');
        });
    }
}, function() {
    if (chrome.extension.lastError) {
        console.log('contextMenus.create: ', chrome.extension.lastError.message);
    }
});