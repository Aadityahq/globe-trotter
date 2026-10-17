import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EmailService } from "./email.service";

//? Not @Global because only the auth module needs it
@Module({
  imports: [ConfigModule],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}