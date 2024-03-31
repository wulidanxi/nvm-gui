import request from '@render/utils/request'

export function getNodeReleaseRecord() : Promise<any> { 
    return request({
        url:'https://nodejs.org/dist/index.json'
    })
}