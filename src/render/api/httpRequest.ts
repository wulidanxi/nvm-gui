import request from '@render/utils/request'
import { useNodeURLStore } from "@render/stores/NodeURLStore";

export function getNodeReleaseRecord() : Promise<any> {
    const store = useNodeURLStore();
    const url = store.nodeUrl;
    return request({
        url:url
    })
}