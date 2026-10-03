"""
Interface class to the tokenizer module.

Versions:
2026-09-20: Use token numerical values from token module rather than hardcoding,
            use our own functions to DRY more, fix __str__
2021-03-27: Checking for comments (#) in is_at_end altered since 55 didn't work everywhere
2021-03-01: Comments (#) added
2020-09-05:
"""
import io
import tokenize
import token

class TokenizeWrapper:
    def __init__(self, line):
        self.line = line
        self.tokens = tokenize.generate_tokens(io.StringIO(line).readline)
        self.current = next(self.tokens)
        self.previous = 'START'

    def __str__(self):
        return f'({self.current[0]}:{token.tok_name.get(self.current[0], None)}, {self.current[1]})'

    def get_current(self):
        if self.current[0] != token.ENDMARKER:
            return self.current[1]
        else:
            return 'NO MORE TOKENS'

    def get_previous(self):
        return self.previous

    def next(self):
        # The return value is mainly intended for debugging purposes
        if self.has_next():
            self.previous = self.current[1]
            self.current = next(self.tokens)
            #print('next', self.current[0], self.current[1])
            return self.current
        else:
            return (0, 'EOS')

    def is_number(self):
        return self.current[0] == token.NUMBER

    def is_name(self):
        return self.current[0] == token.NAME
    
    def is_string(self):
        return self.current[0] == token.STRING

    def is_newline(self):
        return self.current[0] == token.NEWLINE
    
    def is_comment(self):
        return self.current[0] == token.COMMENT

    def is_at_end(self):
        return self.current[0] == token.ENDMARKER or self.is_newline() \
               or self.is_comment()

    def has_next(self):
        return self.current[0] != token.ENDMARKER and not self.is_newline()


def main():
    line = 'hello! 25 123.4 (1e10 ++) - "LAST" #hej hopp'
    print(token.ENDMARKER)
    w = TokenizeWrapper(line)
    try:
        while w.has_next():
            print(w.get_current(), end='\t')
            if w.is_name():
                print('NAME')
            elif w.is_number():
                print('NUMBER')
            elif w.is_string():
                print('STRING')
            elif w.is_comment():
                print('COMMENT')
            else:
                print()
            w.next()
    except tokenize.TokenError:  # For handling unbalanced parentheses
        print('*** Unbalanced parentheses')
    print('Bye')


if __name__ == '__main__':
    main()
