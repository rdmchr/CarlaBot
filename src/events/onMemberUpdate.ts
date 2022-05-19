import { PrismaClient } from "@prisma/client";
import { ArgsOf, Discord, On } from "discordx";

@Discord()
export class onMemberUpdate {
    @On('userUpdate')
    async onMemberUpdate([user]: ArgsOf<"userUpdate">): Promise<void> {
        console.log('NEW USER UPDATE!')
        const prisma = new PrismaClient();
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