import { prisma } from "./src/app/lib/prisma";

async function test() {
    const projectId = "cmjdk1xk200038wfeebse1ga9";
    try {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                epics: {
                    include: {
                        features: {
                            include: {
                                userStories: {
                                    include: {
                                        tasks: { include: { assignee: true, risks: true } }
                                    }
                                },
                                tasks: { include: { assignee: true, risks: true } }
                            }
                        },
                        tasks: { include: { assignee: true, risks: true } }
                    },
                },
                sprints: { include: { tasks: true } },
            },
        });
    } catch (error) {
        console.error("Prisma Error:", error);
    }
}

test();
