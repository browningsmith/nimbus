plytojs: y.tab.c lex.yy.c plytojs.h
	gcc -Wall -o plytojs y.tab.c lex.yy.c -ll

y.tab.c: plytojs.y
	yacc -Wconflicts-sr -d plytojs.y

lex.yy.c: plytojs.l
	lex plytojs.l

clean:
	rm -f *.h *.c plytojs
