import { Injectable } from 'einf'

@Injectable()
/** einf 依赖注入的基础应用服务。 */
export class AppService {
  public getDelayTime(): number {
    return 1
  }
}
