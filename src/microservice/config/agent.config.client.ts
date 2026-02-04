import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { SERVICES, URL_CONFIG } from 'src/shared/constant/client.constant';
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

  private readonly cmd = SERVICES.CONFIG.cmd;

  /**
   * Create Agent to Config Service
   */
  async create(body: CreateAgentSystemDto) {
    try {
      const res = await axios.get<ResponseDto<null>>(
        `${URL_CONFIG}/agent/internal`,
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
          { cmd: this.cmd.create_agent_config },
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
