const execSync = require("child_process").execSync;

// git 对所有冲突的地方都会生成下面这种格式的信息，所以写个检测冲突文件的正则
const isConflictRegular = "^<<<<<<<\\s|^=======$|^>>>>>>>\\s";
const version =
    process.env.scene +
    "_" +
    (function () {
        const now = new Date();
        return (
            ("" + now.getFullYear()).slice(-2) + ("00" + (now.getMonth() + 1)).slice(-2) + ("00" + now.getDate()).slice(-2) + ("00" + now.getHours()).slice(-2) + ("00" + now.getMinutes()).slice(-2)
        );
    })();
const scene = process.env.scene;
let results;
try {
    // git grep 命令会执行 perl 的正则匹配所有满足冲突条件的文件
    results = execSync(`git grep -n -P "${isConflictRegular}"`, {
        encoding: "utf-8"
    });

    if (results) {
        console.log("\x1B[31m>>>>>>>>>>>>>>>发现冲突，请解决后再提交，冲突文件<<<<<<<<<<<<<<<<<< \x1B[0m");
        console.error(results.trim());
    }
} catch (e) {
    try {
        results = execSync(`git status`, {
            encoding: "utf-8"
        });
        if (results.indexOf("Changes not staged for commit") >= 0) {
            results = execSync(`git add -A `, {
                encoding: "utf-8"
            });
            results = execSync(`git commit -m build_${version}`, {
                encoding: "utf-8"
            });
            results = execSync(`git push `, {
                encoding: "utf-8"
            });
        }
        results = execSync(`git tag -a ${version} -m ${version}`, {
            encoding: "utf-8"
        });
        results = execSync(`git push origin ${version}`, {
            encoding: "utf-8"
        });
        console.log(`\n\x1B[33mtag发布成功， ----- ${version}，一般会在5分钟内完成部署 \x1B[0m`);
    } catch (e) {
        console.log("\x1B[31m >>>>>>>>>>>>>>> " + results + " <<<<<<<<<<<<<<<<<< \x1B[0m");
        console.log("\x1B[31m >>>>>>>>>>>>>>>自动发布失败<<<<<<<<<<<<<<<<<< \x1B[0m");
    }
}
