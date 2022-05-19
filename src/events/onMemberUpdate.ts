import { ArgsOf, Discord, On } from "discordx";
import {prisma} from "../utils/prisma.js";

@Discord()
export class onMemberUpdate {
    @On('userUpdate')
    async onMemberUpdate([user]: ArgsOf<"userUpdate">): Promise<void> {
        const newUser = await user.client.users.fetch(user.id);

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                lastSeen: new Date(),
                tag: newUser.tag,
            },
        });
    }
}