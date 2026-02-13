import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES } from 'src/shared/constant/client.constant';
import { CreateAgentSystemDto } from './dto-system/create-agent.system.dto';
import { firstValueFrom } from 'rxjs';
import { ResponseDto } from 'src/shared/response.dto';
import axios from 'axios';

@Injectable()
export class AgentConfigClient {
  constructor(
    @Inject(SERVICES.CONFIG.name)
    private readonly configClient: ClientProxy,
  ) {}

  private readonly point = SERVICES.CONFIG.point;

  /**
   * Create Agent to Config Service
   */
  async create(body: CreateAgentSystemDto) {
    try {
      const res = await axios.get<ResponseDto<null>>(
        this.point.create_agent_config.url,
        { data: body },
      );
      return res.data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async createTCP(body: CreateAgentSystemDto) {
    try {
      const res = await firstValueFrom(
        this.configClient.send<ResponseDto<null>>(
          { cmd: this.point.create_agent_config.cmd },
          body,
        ),
      );
      return res;
    } catch (error) {
      console.log(error);
      return this.create(body);
      throw error;
    }
  }
}
